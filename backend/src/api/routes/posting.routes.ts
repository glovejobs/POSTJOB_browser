import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../../middleware\auth.middleware';
import { addJobToQueue } from '../../queue/job.queue';
import { browserService } from '../../services/browser.service';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const prisma = new PrismaClient();

// POST /api/posting/start - Start job posting process
router.post('/start', authenticate, async (req: AuthRequest, res) => {
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

    // Check if job is already being posted
    if (job.status === 'posting') {
      return res.status(400).json({ error: 'Job is already being posted' });
    }

    // Create job postings for each selected board
    const postings = await Promise.all(
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

    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'posting' }
    });

    // Add to queue for processing
    await addJobToQueue(jobId);

    return res.json({
      message: 'Job posting started',
      jobId,
      postings: postings.length
    });
  } catch (error) {
    console.error('Error starting job posting:', error);
    return res.status(500).json({ error: 'Failed to start job posting' });
  }
});

// GET /api/posting/status/:jobId - Get posting status
router.get('/status/:jobId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
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

    // Calculate posting statistics
    const stats = {
      total: job.postings.length,
      pending: job.postings.filter(p => p.status === 'pending').length,
      posting: job.postings.filter(p => p.status === 'posting').length,
      success: job.postings.filter(p => p.status === 'success').length,
      failed: job.postings.filter(p => p.status === 'failed').length
    };

    return res.json({
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        company: job.company
      },
      stats,
      postings: job.postings.map(p => ({
        id: p.id,
        boardName: p.board.name,
        status: p.status,
        externalUrl: p.externalUrl,
        errorMessage: p.errorMessage,
        postedAt: p.postedAt,
        updatedAt: p.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching posting status:', error);
    return res.status(500).json({ error: 'Failed to fetch posting status' });
  }
});

// GET /api/posting/screenshot/:postingId - Get posting screenshot
router.get('/screenshot/:postingId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { postingId } = req.params;
    const userId = req.user!.id;

    const posting = await prisma.jobPosting.findUnique({
      where: { id: postingId },
      include: {
        job: true,
        board: true
      }
    });

    if (!posting) {
      return res.status(404).json({ error: 'Posting not found' });
    }

    // Verify ownership
    if (posting.job.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Construct screenshot path
    const screenshotDir = path.join(process.cwd(), 'screenshots');
    const screenshotFiles = await fs.readdir(screenshotDir);

    // Find screenshot for this posting
    const boardName = posting.board.name.toLowerCase().replace(/\s+/g, '_');
    const successScreenshot = screenshotFiles.find(file =>
      file.includes(boardName) && file.includes('success')
    );

    if (!successScreenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    const screenshotPath = path.join(screenshotDir, successScreenshot);
    const screenshot = await fs.readFile(screenshotPath);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', screenshot.length.toString());
    return res.send(screenshot);
  } catch (error) {
    console.error('Error fetching screenshot:', error);
    return res.status(500).json({ error: 'Failed to fetch screenshot' });
  }
});

// POST /api/posting/retry/:postingId - Retry failed posting
router.post('/retry/:postingId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { postingId } = req.params;
    const userId = req.user!.id;

    const posting = await prisma.jobPosting.findUnique({
      where: { id: postingId },
      include: { job: true }
    });

    if (!posting) {
      return res.status(404).json({ error: 'Posting not found' });
    }

    // Verify ownership
    if (posting.job.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Only retry failed postings
    if (posting.status !== 'failed') {
      return res.status(400).json({ error: 'Can only retry failed postings' });
    }

    // Reset posting status
    await prisma.jobPosting.update({
      where: { id: postingId },
      data: {
        status: 'pending',
        errorMessage: null
      }
    });

    // Add job back to queue
    await addJobToQueue(posting.jobId);

    return res.json({
      message: 'Retry initiated',
      postingId
    });
  } catch (error) {
    console.error('Error retrying posting:', error);
    return res.status(500).json({ error: 'Failed to retry posting' });
  }
});

// POST /api/posting/test-board - Test board connection
router.post('/test-board', authenticate, async (req: AuthRequest, res) => {
  try {
    const { boardId } = req.body;

    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }

    const board = await prisma.jobBoard.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Test connection to board
    const isConnected = await browserService.testBoardConnection(board.postUrl);

    return res.json({
      boardName: board.name,
      url: board.postUrl,
      connected: isConnected,
      message: isConnected ? 'Board is accessible' : 'Failed to connect to board'
    });
  } catch (error) {
    console.error('Error testing board:', error);
    return res.status(500).json({ error: 'Failed to test board connection' });
  }
});

// GET /api/posting/logs/:jobId - Get posting logs
router.get('/logs/:jobId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get posting logs from database or file system
    // For now, return mock logs
    const logs = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'Starting job posting process' },
      { timestamp: new Date().toISOString(), level: 'info', message: 'Connecting to Harvard University Careers' },
      { timestamp: new Date().toISOString(), level: 'success', message: 'Successfully posted to Harvard' },
      { timestamp: new Date().toISOString(), level: 'warning', message: 'MIT Careers site is slow to respond' },
      { timestamp: new Date().toISOString(), level: 'error', message: 'Failed to post to Stanford - timeout' }
    ];

    return res.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;