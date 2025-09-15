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

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 jobs per hour per IP
  message: 'Too many job postings from this IP, please try again later.'
});

app.use('/api/jobs', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/boards', boardRoutes);

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