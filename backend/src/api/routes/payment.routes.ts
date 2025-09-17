import { Router } from 'express';
import Stripe from 'stripe';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { paymentService } from '../../services/payment.service';
import { config } from '../../config/environment';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(config.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-11-20.acacia',
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
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Create checkout session
    const session = await paymentService.createCheckoutSession({
      jobId,
      userId,
      boardCount: boardIds.length,
      successUrl: `${config.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${config.FRONTEND_URL}/job/${jobId}`
    });

    // Store selected boards for later processing
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'payment_pending'
      }
    });

    // Create pending job postings
    await Promise.all(
      boardIds.map(boardId =>
        prisma.jobPosting.create({
          data: {
            jobId,
            boardId,
            status: 'pending'
          }
        })
      )
    );

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
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const paymentIntent = await paymentService.createPaymentIntent({
      jobId,
      userId,
      boardCount
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
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId: req.user!.id }
      });

      if (!job) {
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

    const success = await paymentService.confirmPayment(paymentIntentId);

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
    const payments = await paymentService.getPaymentHistory(userId);

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
    const job = await prisma.job.findFirst({
      where: {
        paymentIntentId: paymentId,
        userId
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const invoice = await paymentService.generateInvoice(paymentId);

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