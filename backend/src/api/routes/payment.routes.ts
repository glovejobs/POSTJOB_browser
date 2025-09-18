import { Router } from 'express';
import Stripe from 'stripe';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { config } from '../../config/environment';
import db from '../../services/database.service';
import supabase from '../../database/supabase';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(config.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-08-27.basil',
});

// POST /api/payment/create-checkout - Create Stripe checkout session
router.post('/create-checkout', authenticate, async (req: AuthRequest, res) => {
  try {
    const { jobId, boardIds } = req.body;
    const userId = req.user!.id;

    if (!jobId || !boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
      return res.status(400).json({ error: 'Job ID and board IDs are required' });
    }

    // Verify job ownership
    const job = await db.job.findById(jobId);
    if (!job || job.user_id !== userId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate price
    const pricePerJob = config.STRIPE_PRICE_PER_JOB || 299; // in cents

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Job Posting - ${job.title}`,
            description: `Posting to ${boardIds.length} job board(s)`
          },
          unit_amount: pricePerJob
        },
        quantity: boardIds.length
      }],
      mode: 'payment',
      metadata: {
        jobId,
        userId,
        boardCount: boardIds.length.toString()
      },
      success_url: `${config.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.FRONTEND_URL}/job/${jobId}`
    });

    // Store selected boards for later processing
    await db.job.update(jobId, {
      status: 'payment_pending'
    });

    // Create pending job postings
    await db.jobPosting.createMany(jobId, boardIds);

    return res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/payment/create-intent - Create payment intent
router.post('/create-intent', authenticate, async (req: AuthRequest, res) => {
  try {
    const { jobId, boardCount } = req.body;
    const userId = req.user!.id;

    if (!jobId || !boardCount) {
      return res.status(400).json({ error: 'Job ID and board count are required' });
    }

    // Verify job ownership
    const job = await db.job.findById(jobId);
    if (!job || job.user_id !== userId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Create payment intent
    const amount = (config.STRIPE_PRICE_PER_JOB || 299) * boardCount;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        jobId,
        userId,
        boardCount: boardCount.toString()
      }
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// GET /api/payment/session/:sessionId - Get checkout session details
router.get('/session/:sessionId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify user owns the job
    const jobId = session.metadata?.jobId;
    if (jobId) {
      const job = await db.job.findById(jobId);
      if (!job || job.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    return res.json({
      status: session.payment_status,
      amount: session.amount_total,
      customerEmail: session.customer_email,
      jobId: session.metadata?.jobId
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /api/payment/confirm - Confirm payment
router.post('/confirm', authenticate, async (req: AuthRequest, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Retrieve payment intent to verify
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const success = paymentIntent.status === 'succeeded';

    if (success) {
      return res.json({ success: true, message: 'Payment confirmed' });
    } else {
      return res.status(400).json({ error: 'Payment confirmation failed' });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// GET /api/payment/history - Get payment history
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    // Get all jobs with payment info for this user
    const jobs = await db.job.findByUser(userId);
    const payments = jobs.filter((job: any) => job.payment_intent_id).map((job: any) => ({
      id: job.payment_intent_id,
      jobId: job.id,
      jobTitle: job.title,
      amount: (config.STRIPE_PRICE_PER_JOB || 299),
      status: job.payment_status,
      createdAt: job.created_at
    }));

    return res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// GET /api/payment/invoice/:paymentId - Download invoice
router.get('/invoice/:paymentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user!.id;

    // Verify user owns this payment
    // We need to find by payment intent ID, which requires a Supabase query
    const { data: jobs } = await supabase
      .from('postjob_jobs')
      .select('*')
      .eq('payment_intent_id', paymentId)
      .eq('user_id', userId)
      .limit(1);

    const job = jobs?.[0];

    if (!job) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Generate simple HTML invoice
    const invoice = `
      <!DOCTYPE html>
      <html>
      <head><title>Invoice</title></head>
      <body>
        <h1>Invoice</h1>
        <p>Job: ${job.title}</p>
        <p>Company: ${job.company}</p>
        <p>Amount: $${((config.STRIPE_PRICE_PER_JOB || 299) / 100).toFixed(2)}</p>
        <p>Payment ID: ${paymentId}</p>
        <p>Date: ${new Date(job.created_at).toLocaleDateString()}</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${paymentId.substring(0, 8)}.html"`);
    return res.send(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// POST /api/payment/webhook - Stripe webhook endpoint (already in webhook.routes.ts)

export default router;