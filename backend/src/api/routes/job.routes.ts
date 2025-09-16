import { Router } from 'express';
import Stripe from 'stripe';
import prisma from '../../database/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { addJobToQueue } from '../../queue/job.queue';
import { CreateJobRequest, JobStatusResponse } from '../../types';
import { config } from '../../config/environment';

const router = Router();
const isStripeEnabled = config.STRIPE_SECRET_KEY && !config.STRIPE_SECRET_KEY.includes('test_123');

let stripe: Stripe | null = null;
if (isStripeEnabled) {
  stripe = new Stripe(config.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil'
  });
}

// POST /api/jobs - Create a new job posting
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const jobData: CreateJobRequest = req.body;
    const userId = req.user!.id;
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'location', 'company', 'contact_email'];
    for (const field of requiredFields) {
      if (!jobData[field as keyof CreateJobRequest]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }
    
    // Create job in database first (as draft)
    const job = await prisma.job.create({
      data: {
        userId,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        salaryMin: jobData.salary_min,
        salaryMax: jobData.salary_max,
        company: jobData.company,
        contactEmail: jobData.contact_email,
        employmentType: jobData.employment_type || 'full-time',
        department: jobData.department,
        status: 'draft' // Start as draft until boards are selected
      }
    });

    return res.status(201).json({
      id: job.id,
      message: 'Job created successfully. Please select job boards to publish.'
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ error: 'Failed to create job' });
  }
});

// GET /api/jobs/:id/status - Get job posting status
router.get('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user!.id;
    
    // Get job with postings
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId
      },
      include: {
        postings: {
          include: {
            board: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const response: JobStatusResponse = {
      job_id: job.id,
      overall_status: job.status as any,
      postings: job.postings.map((posting: any) => ({
        board_id: posting.boardId,
        board_name: posting.board.name,
        status: posting.status as any,
        external_url: posting.externalUrl || undefined,
        error_message: posting.errorMessage || undefined
      }))
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching job status:', error);
    return res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// POST /api/jobs/:id/publish - Create job postings with selected boards
router.post('/:id/publish', authenticate, async (req: AuthRequest, res) => {
  try {
    const jobId = req.params.id;
    const { boardIds } = req.body;
    const userId = req.user!.id;
    
    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId
      }
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (!boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
      return res.status(400).json({ error: 'Board IDs are required' });
    }
    
    // Create job postings for each board
    await prisma.jobPosting.createMany({
      data: boardIds.map(boardId => ({
        jobId: job.id,
        boardId,
        status: 'pending'
      })),
      skipDuplicates: true
    });
    
    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'payment_pending' }
    });
    
    // Calculate total price based on board count
    const pricePerJob = config.STRIPE_PRICE_PER_JOB || 299; // $2.99 in cents
    
    // Create payment intent
    let paymentIntent;
    if (stripe && isStripeEnabled) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: pricePerJob,
        currency: 'usd',
        metadata: {
          userId,
          jobId: job.id,
          jobTitle: job.title,
          boardCount: boardIds.length.toString()
        }
      });
    } else {
      // Development mode: create mock payment intent
      console.log('⚠️ Development mode: Using mock payment (Stripe not configured)');
      paymentIntent = {
        id: `mock_pi_${job.id}_${Date.now()}`,
        client_secret: `mock_secret_${job.id}_${Date.now()}`,
        status: 'requires_payment_method'
      };
    }
    
    // Update job with payment intent ID
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'pending'
      }
    });
    
    return res.status(201).json({
      id: job.id,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    console.error('Error publishing job:', error);
    return res.status(500).json({ error: 'Failed to publish job' });
  }
});

// POST /api/jobs/:id/confirm-payment - Confirm payment and start posting process
router.post('/:id/confirm-payment', authenticate, async (req: AuthRequest, res) => {
  try {
    const jobId = req.params.id;
    const { payment_intent_id } = req.body;
    const userId = req.user!.id;
    
    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId
      }
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Verify payment intent
    let paymentIntent;
    if (stripe && isStripeEnabled) {
      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    } else {
      // Development mode: auto-approve mock payments
      console.log('⚠️ Development mode: Auto-approving mock payment');
      paymentIntent = {
        id: payment_intent_id,
        status: payment_intent_id.startsWith('mock_') ? 'succeeded' : 'failed'
      };
    }
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not confirmed' });
    }
    
    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'posting' }
    });
    
    // Add job to queue for processing
    await addJobToQueue(jobId);
    
    return res.json({ message: 'Job queued for posting', jobId });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// GET /api/jobs - List user's jobs
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const jobs = await prisma.job.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            postings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id/payment-intent - Get or create payment intent for job
router.get('/:id/payment-intent', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const jobId = req.params.id;
    const userId = req.user!.id;

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId
      },
      include: {
        postings: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if payment intent already exists
    if (job.paymentIntentId) {
      return res.json({
        paymentIntent: {
          id: job.paymentIntentId,
          client_secret: `${job.paymentIntentId}_secret`
        }
      });
    }

    // Create new payment intent
    const pricePerJob = config.STRIPE_PRICE_PER_JOB || 299; // $2.99 in cents
    let paymentIntent;

    if (stripe && isStripeEnabled) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: pricePerJob,
        currency: 'usd',
        metadata: {
          userId,
          jobId: job.id,
          jobTitle: job.title,
          boardCount: job.postings.length.toString()
        }
      });
    } else {
      // Development mode
      paymentIntent = {
        id: `mock_pi_${job.id}_${Date.now()}`,
        client_secret: `mock_secret_${job.id}_${Date.now()}`
      };
    }

    // Update job with payment intent ID
    await prisma.job.update({
      where: { id: jobId },
      data: {
        paymentIntentId: paymentIntent.id
      }
    });

    return res.json({
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    console.error('Error getting payment intent:', error);
    return res.status(500).json({ error: 'Failed to get payment intent' });
  }
});

// GET /api/jobs/:id - Get single job details
router.get('/:id', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const jobId = req.params.id;
    const userId = req.user!.id;
    
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId
      },
      include: {
        postings: {
          include: {
            board: true
          }
        }
      }
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    return res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
});

export default router;