import { Router } from 'express';
import Stripe from 'stripe';
import db from '../../services/database.service';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { addJobToQueue } from '../../queue/job.queue';
import { CreateJobRequest, JobStatusResponse } from '../../types';
import { config } from '../../config/environment';
import { emailService } from '../../services/email.service';
import { getBoardUUID } from '../../config/boards.config';

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
    
    // Create job in database first (as pending)
    const job = await db.job.create({
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
      status: 'pending' // Start as pending until boards are selected
    });

    // Send email notification
    try {
      const user = await db.user.findById(userId);

      if (user?.email) {
        await emailService.sendJobCreatedEmail(user.email, {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location
        });
      }
    } catch (emailError) {
      console.error('Failed to send job created email:', emailError);
      // Don't fail the request if email fails
    }

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
    // Check job ownership and get job with postings
    const job = await db.job.findById(jobId, true);

    if (!job || job.user_id !== userId) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const response: JobStatusResponse = {
      job_id: job.id,
      overall_status: job.status as any,
      postings: job.postings.map((posting: any) => ({
        board_id: posting.board_id,
        board_name: posting.board.name,
        status: posting.status as any,
        external_url: posting.external_url || undefined,
        error_message: posting.error_message || undefined
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
    const job = await db.job.findById(jobId);

    if (!job || job.user_id !== userId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
      return res.status(400).json({ error: 'Board IDs are required' });
    }

    // Create job postings for each board
    await db.jobPosting.createMany(job.id, boardIds);

    // Update job status
    await db.job.update(jobId, { status: 'payment_pending' });
    
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
    await db.job.update(jobId, {
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'pending'
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
    const job = await db.job.findById(jobId);

    if (!job || job.user_id !== userId) {
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
    await db.job.update(jobId, { status: 'posting' });
    
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
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const jobs = await db.job.findByUser(userId, limit);

    // Transform to match dashboard expectations
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      status: job.status,
      createdAt: job.created_at,
      applicationCount: job.applicationCount || 0
    }));

    res.json(transformedJobs);
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

    const job = await db.job.findById(jobId, true);

    if (!job || job.user_id !== userId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if payment intent already exists
    if (job.payment_intent_id) {
      return res.json({
        paymentIntent: {
          id: job.payment_intent_id,
          client_secret: `${job.payment_intent_id}_secret`
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
          boardCount: (job.postings || []).length.toString()
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
    await db.job.update(jobId, {
      paymentIntentId: paymentIntent.id
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

    const job = await db.job.findById(jobId, true);

    if (!job || job.user_id !== userId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// PUT /api/jobs/:id - Update job details
router.put('/:id', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const jobId = req.params.id;
    const userId = req.user!.id;
    const updates = req.body;

    // Verify job belongs to user
    const job = await db.job.findById(jobId);

    if (!job || job.user_id !== userId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Handle board selection updates
    if (updates.postings && Array.isArray(updates.postings)) {
      // Delete existing postings
      await db.jobPosting.deleteByJob(jobId);

      // Create new postings
      if (updates.postings.length > 0) {
        // Map board codes to UUIDs
        const validBoardIds = [];
        for (const posting of updates.postings) {
          const boardCode = posting.board_id || posting.boardId;

          // Check if it's already a UUID
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boardCode);

          if (isUUID) {
            validBoardIds.push(boardCode);
          } else {
            // Try to get UUID from board code
            const boardUUID = getBoardUUID(boardCode);
            if (boardUUID) {
              validBoardIds.push(boardUUID);
            } else {
              console.warn(`Unknown board code: ${boardCode}`);
            }
          }
        }

        if (validBoardIds.length > 0) {
          await db.jobPosting.createMany(jobId, validBoardIds);
        }
      }

      // Update job status to payment_pending if boards are selected
      await db.job.update(jobId, { status: 'payment_pending' });
    }

    // Update other job fields if provided
    const updateData: any = {};
    const allowedFields = ['title', 'description', 'location', 'company', 'salaryMin', 'salaryMax',
                          'contactEmail', 'employmentType', 'department', 'status'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.job.update(jobId, updateData);
    }

    // Return updated job
    const updatedJob = await db.job.findById(jobId, true);

    return res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    return res.status(500).json({ error: 'Failed to update job' });
  }
});

export default router;