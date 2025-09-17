import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

// Import configuration (validates environment on load)
import { config } from './config/environment';

// Import routes
import authRoutes from './api/routes/auth.routes';
import jobRoutes from './api/routes/job.routes';
import boardRoutes from './api/routes/board.routes';
import webhookRoutes from './api/routes/webhook.routes';
import userRoutes from './api/routes/user.routes';
import applicationRoutes from './api/routes/application.routes';
import analyticsRoutes from './api/routes/analytics.routes';
import searchRoutes from './api/routes/search.routes';
import postingRoutes from './api/routes/posting.routes';
import paymentRoutes from './api/routes/payment.routes';
// import publicRoutes from './api/routes/public.routes';

// Import queue
import { initQueue } from './queue/job.queue';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: config.FRONTEND_URL,
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Stripe webhook needs raw body
app.use('/api/webhooks', webhookRoutes);

// JSON parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - adjusted for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === 'development' ? 100 : 20, // 100 requests per 15 min in dev, 20 in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for GET requests in development
    return config.NODE_ENV === 'development' && req.method === 'GET';
  }
});

// Apply rate limiting only to POST/PUT/DELETE operations
app.use('/api/jobs', (req, res, next) => {
  // Only apply rate limiting to state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return limiter(req, res, next);
  }
  return next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/posting', postingRoutes);
app.use('/api/payment', paymentRoutes);
// app.use('/api/jobs', publicRoutes);
// app.use('/api/applications', publicRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe-job', (jobId: string) => {
    socket.join(`job-${jobId}`);
    console.log(`Client ${socket.id} subscribed to job ${jobId}`);
  });
  
  socket.on('unsubscribe-job', (jobId: string) => {
    socket.leave(`job-${jobId}`);
    console.log(`Client ${socket.id} unsubscribed from job ${jobId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize queue
initQueue();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  // Close HTTP server
  httpServer.close(() => {
    console.log('📡 HTTP server closed');
  });
  
  // Disconnect Prisma
  await prisma.$disconnect();
  console.log('🗄️  Database disconnected');
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  httpServer.close(() => {
    console.log('📡 HTTP server closed');
  });
  
  await prisma.$disconnect();
  console.log('🗄️  Database disconnected');
  
  process.exit(0);
});

// Start server
httpServer.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
  console.log(`🌐 Frontend URL: ${config.FRONTEND_URL}`);
  console.log(`🔒 Environment: ${config.NODE_ENV}`);
});