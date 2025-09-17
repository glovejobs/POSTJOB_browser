import Stripe from 'stripe';
import { config } from '../config/environment';
import { PrismaClient } from '@prisma/client';
import { emailService } from './email.service';

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(config.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-08-27.basil',
});

export interface PaymentIntentData {
  amount: number;
  currency: string;
  metadata: {
    jobId: string;
    userId: string;
    boardCount: number;
  };
}

export interface InvoiceData {
  customerEmail: string;
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
  metadata: {
    jobId: string;
    userId: string;
  };
}

class PaymentService {
  private readonly PRICE_PER_BOARD = 299; // $2.99 in cents

  async createPaymentIntent(data: {
    jobId: string;
    userId: string;
    boardCount: number;
  }): Promise<Stripe.PaymentIntent> {
    const amount = this.PRICE_PER_BOARD * data.boardCount;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        jobId: data.jobId,
        userId: data.userId,
        boardCount: data.boardCount.toString(),
      },
    });

    // Update job with payment intent ID
    await prisma.job.update({
      where: { id: data.jobId },
      data: {
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'pending'
      }
    });

    return paymentIntent;
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update job payment status
        const job = await prisma.job.findFirst({
          where: { paymentIntentId },
          include: { user: true }
        });

        if (job) {
          await prisma.job.update({
            where: { id: job.id },
            data: {
              paymentStatus: 'succeeded',
              status: 'payment_completed'
            }
          });

          // Send confirmation email
          if (job.user.email) {
            await emailService.sendPaymentConfirmationEmail(
              job.user.email,
              {
                id: job.id,
                title: job.title,
                company: job.company,
                location: job.location
              },
              paymentIntent.amount
            );
          }

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Payment confirmation error:', error);
      return false;
    }
  }

  async createCustomer(userData: {
    email: string;
    name?: string;
    userId: string;
  }): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      email: userData.email,
      name: userData.name,
      metadata: {
        userId: userData.userId
      }
    });

    // Update user with Stripe customer ID
    await prisma.user.update({
      where: { id: userData.userId },
      data: { stripeCustomerId: customer.id }
    });

    return customer;
  }

  async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.stripeCustomerId) {
      return await stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
    }

    return await this.createCustomer({
      email: user.email,
      name: user.name || undefined,
      userId: user.id
    });
  }

  async createCheckoutSession(data: {
    jobId: string;
    userId: string;
    boardCount: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    const customer = await this.getOrCreateCustomer(data.userId);

    const job = await prisma.job.findUnique({
      where: { id: data.jobId }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Job Posting - ${job.title}`,
              description: `Post to ${data.boardCount} university career board${data.boardCount > 1 ? 's' : ''}`,
              images: ['https://postjob.com/logo.png'],
            },
            unit_amount: this.PRICE_PER_BOARD,
          },
          quantity: data.boardCount,
        },
      ],
      mode: 'payment',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        jobId: data.jobId,
        userId: data.userId,
        boardCount: data.boardCount.toString(),
      },
    });

    // Update job with session ID
    await prisma.job.update({
      where: { id: data.jobId },
      data: {
        paymentIntentId: session.id,
        paymentStatus: 'pending'
      }
    });

    return session;
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentFailure(failedPayment);
        break;

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const jobId = paymentIntent.metadata.jobId;

    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { user: true }
      });

      if (job) {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            paymentStatus: 'succeeded',
            status: 'payment_completed'
          }
        });

        // Send confirmation email
        if (job.user.email) {
          await emailService.sendPaymentConfirmationEmail(
            job.user.email,
            {
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location
            },
            paymentIntent.amount
          );
        }
      }
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const jobId = paymentIntent.metadata.jobId;

    if (jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          paymentStatus: 'failed',
          status: 'payment_failed'
        }
      });
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const jobId = session.metadata?.jobId;

    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { user: true }
      });

      if (job) {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            paymentStatus: 'succeeded',
            status: 'ready_to_post'
          }
        });

        // Automatically start job posting
        const { addJobToQueue } = await import('../queue/job.queue');
        await addJobToQueue(jobId);

        // Send confirmation email
        if (job.user.email && session.amount_total) {
          await emailService.sendPaymentConfirmationEmail(
            job.user.email,
            {
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location
            },
            session.amount_total
          );
        }
      }
    }
  }

  async getPaymentHistory(userId: string): Promise<any[]> {
    const jobs = await prisma.job.findMany({
      where: {
        userId,
        paymentStatus: 'succeeded'
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        paymentIntentId: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { postings: true }
        }
      }
    });

    // Get payment details from Stripe
    const payments = await Promise.all(
      jobs.map(async (job) => {
        let paymentAmount = 0;
        let paymentDate = job.updatedAt;

        if (job.paymentIntentId) {
          try {
            if (job.paymentIntentId.startsWith('pi_')) {
              const paymentIntent = await stripe.paymentIntents.retrieve(job.paymentIntentId);
              paymentAmount = paymentIntent.amount;
              paymentDate = new Date(paymentIntent.created * 1000);
            } else if (job.paymentIntentId.startsWith('cs_')) {
              const session = await stripe.checkout.sessions.retrieve(job.paymentIntentId);
              paymentAmount = session.amount_total || 0;
              paymentDate = new Date((session.created || 0) * 1000);
            }
          } catch (error) {
            console.error('Error fetching payment details:', error);
          }
        }

        return {
          id: job.id,
          title: job.title,
          company: job.company,
          amount: paymentAmount,
          boardCount: job._count.postings,
          status: job.paymentStatus,
          date: paymentDate
        };
      })
    );

    return payments;
  }

  async generateInvoice(paymentId: string): Promise<Buffer> {
    // This would integrate with a PDF generation library
    // For now, return a simple HTML invoice
    const payment = await this.getPaymentDetails(paymentId);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #FF5A5F; }
            .invoice-details { text-align: right; }
            .invoice-number { font-size: 18px; margin-bottom: 10px; }
            .date { color: #666; }
            .billing { margin-bottom: 40px; }
            .billing h3 { margin-bottom: 10px; }
            .items { width: 100%; border-collapse: collapse; }
            .items th { background: #f5f5f5; padding: 10px; text-align: left; }
            .items td { padding: 10px; border-bottom: 1px solid #eee; }
            .total { text-align: right; margin-top: 20px; font-size: 18px; }
            .footer { margin-top: 60px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div class="logo">PostJob</div>
              <div class="invoice-details">
                <div class="invoice-number">Invoice #${payment.id.substring(0, 8)}</div>
                <div class="date">${new Date(payment.date).toLocaleDateString()}</div>
              </div>
            </div>

            <div class="billing">
              <h3>Bill To:</h3>
              <p>${payment.customerName}<br>${payment.customerEmail}</p>
            </div>

            <table class="items">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Job Posting - ${payment.jobTitle}</td>
                  <td>${payment.boardCount}</td>
                  <td>$2.99</td>
                  <td>$${(payment.amount / 100).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="total">
              <strong>Total: $${(payment.amount / 100).toFixed(2)}</strong>
            </div>

            <div class="footer">
              <p>Thank you for using PostJob!</p>
              <p>Questions? Contact support@postjob.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return Buffer.from(html);
  }

  private async getPaymentDetails(paymentId: string): Promise<any> {
    // Fetch payment details from database and Stripe
    const job = await prisma.job.findFirst({
      where: { paymentIntentId: paymentId },
      include: {
        user: true,
        postings: true
      }
    });

    if (!job) {
      throw new Error('Payment not found');
    }

    let amount = 0;
    let created = new Date();

    try {
      if (paymentId.startsWith('pi_')) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        amount = paymentIntent.amount;
        created = new Date(paymentIntent.created * 1000);
      } else if (paymentId.startsWith('cs_')) {
        const session = await stripe.checkout.sessions.retrieve(paymentId);
        amount = session.amount_total || 0;
        created = new Date((session.created || 0) * 1000);
      }
    } catch (error) {
      console.error('Error fetching Stripe payment:', error);
    }

    return {
      id: paymentId,
      jobTitle: job.title,
      customerName: job.user.name || 'Customer',
      customerEmail: job.user.email,
      amount,
      boardCount: job.postings.length,
      date: created
    };
  }

  calculateAmount(boardCount: number): number {
    return this.PRICE_PER_BOARD * boardCount;
  }
}

export const paymentService = new PaymentService();