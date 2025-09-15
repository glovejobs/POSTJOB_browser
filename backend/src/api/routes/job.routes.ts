import { Router } from 'express';
import Stripe from 'stripe';
import prisma from '../../database/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { addJobToQueue } from '../../queue/job.queue';
import { CreateJobRequest, JobStatusResponse } from '../../types';
import { config } from '../../config/environment';

const router = Router();
const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil'
});

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
    
    // Get selected boards or default to all enabled boards
    let boardIds = jobData.selected_boards;
    if (!boardIds || boardIds.length === 0) {
      const boards = await prisma.jobBoard.findMany({
        where: { enabled: true },
        select: { id: true }
      });
      boardIds = boards.map((b: { id: string }) => b.id);
    }
    
    // Create job in database first
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
        status: 'pending'
      }
    });
    
    // Create Stripe payment intent with jobId
    const paymentIntent = await stripe.paymentIntents.create({
      amount: config.STRIPE_PRICE_PER_JOB, // $2.99 in cents
      currency: 'usd',
      metadata: {
        userId,
        jobId: job.id,
        jobTitle: jobData.title,
        boardCount: boardIds.length.toString()
      }
    });
    
    // Create job postings for each board
    await prisma.jobPosting.createMany({
      data: boardIds.map(boardId => ({
        jobId: job.id,
        boardId,
        status: 'pending'
      }))
    });
    
    return res.status(201).json({
      jobId: job.id,
      paymentIntent: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }
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
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
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

export default router;