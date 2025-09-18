import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { addJobToQueue } from '../../queue/job.queue';
import db from '../../services/database.service';
import supabase from '../../database/supabase';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// POST /api/posting/start - Start job posting process
router.post('/start', authenticate, async (req: AuthRequest, res) => {
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

    // Check if job is already being posted
    if (job.status === 'posting') {
      return res.status(400).json({ error: 'Job is already being posted' });
    }

    // Create job postings for each selected board
    await db.jobPosting.createMany(jobId, boardIds);

    // Update job status
    await db.job.update(jobId, { status: 'posting' });

    // Add to queue for processing
    await addJobToQueue(jobId);

    return res.json({
      message: 'Job posting started',
      jobId,
      postings: boardIds.length
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

    // Get job and verify ownership
    const job = await db.job.findById(jobId, true); // include postings
    if (!job || job.user_id !== userId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate posting statistics
    const postings = job.postings || [];
    const stats = {
      total: postings.length,
      pending: postings.filter((p: any) => p.status === 'pending').length,
      posting: postings.filter((p: any) => p.status === 'posting').length,
      success: postings.filter((p: any) => p.status === 'success').length,
      failed: postings.filter((p: any) => p.status === 'failed').length
    };

    return res.json({
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        company: job.company
      },
      stats,
      postings: postings.map((p: any) => ({
        id: p.id,
        boardName: p.board?.name,
        status: p.status,
        externalUrl: p.external_url,
        errorMessage: p.error_message,
        postedAt: p.posted_at,
        updatedAt: p.updated_at
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

    // Get posting with job and board info
    const { data: posting } = await supabase
      .from('job_postings')
      .select(`
        *,
        job:postjob_jobs(*),
        board:job_boards(*)
      `)
      .eq('id', postingId)
      .single();

    if (!posting) {
      return res.status(404).json({ error: 'Posting not found' });
    }

    // Verify ownership
    if (posting.job.user_id !== userId) {
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

    // Get posting with job info
    const { data: posting } = await supabase
      .from('job_postings')
      .select(`
        *,
        job:postjob_jobs(*)
      `)
      .eq('id', postingId)
      .single();

    if (!posting) {
      return res.status(404).json({ error: 'Posting not found' });
    }

    // Verify ownership
    if (posting.job.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Only retry failed postings
    if (posting.status !== 'failed') {
      return res.status(400).json({ error: 'Can only retry failed postings' });
    }

    // Reset posting status
    await db.jobPosting.update(postingId, {
      status: 'pending',
      errorMessage: null
    });

    // Add job back to queue
    await addJobToQueue(posting.job_id);

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

    const board = await db.jobBoard.findById(boardId);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Test connection to board
    const isConnected = false; // TODO: Implement testBoardConnection method

    return res.json({
      boardName: board.name,
      url: board.post_url,
      connected: isConnected,
      message: isConnected ? 'Board is accessible' : 'Failed to connect to board'
    });
  } catch (error) {
    console.error('Error testing board:', error);
    return res.status(500).json({ error: 'Failed to test board connection' });
  }
});

// POST /api/posting/test-posting - Test actual job posting with browser preview
router.post('/test-posting', authenticate, async (req: AuthRequest, res) => {
  try {
    const { jobId, boardName, enablePreview } = req.body;
    const userId = req.user!.id;

    if (!jobId || !boardName) {
      return res.status(400).json({ error: 'Job ID and board name are required' });
    }

    // Get job and verify ownership
    const job = await db.job.findById(jobId);
    if (!job || job.user_id !== userId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Set browser preview mode
    if (enablePreview) {
      process.env.BROWSER_PREVIEW = 'true';
      console.log('🖥️ Browser preview mode enabled - browser will be visible');
    } else {
      delete process.env.BROWSER_PREVIEW;
    }

    // Import posting service (dynamic to pick up env changes)
    const { postingService } = await import('../../services/posting.service');

    console.log(`🧪 Starting test posting for ${boardName}...`);
    console.log(`📋 Job: ${job.title} at ${job.company}`);

    // Prepare job data
    const jobData = {
      title: job.title,
      description: job.description,
      location: job.location,
      company: job.company,
      salaryMin: job.salary_min || undefined,
      salaryMax: job.salary_max || undefined,
      employmentType: job.employment_type || undefined,
      department: job.department || undefined,
      contactEmail: job.contact_email
    };

    // Get user for credentials
    const user = await db.user.findById(userId);
    const credentials = {
      email: user?.email || '',
      password: process.env.DEFAULT_POSTING_PASSWORD || 'demo-password',
      company: job.company
    };

    // Perform test posting
    const result = await postingService.postToBoard(boardName, jobData, credentials);

    // Reset browser preview mode
    delete process.env.BROWSER_PREVIEW;

    return res.json({
      success: result.success,
      boardName: result.boardName,
      externalUrl: result.externalUrl,
      errorMessage: result.errorMessage,
      message: result.success ?
        `✅ Successfully posted to ${boardName}${result.externalUrl ? ` - ${result.externalUrl}` : ''}` :
        `❌ Failed to post to ${boardName}: ${result.errorMessage}`,
      previewMode: enablePreview
    });
  } catch (error) {
    // Reset browser preview mode
    delete process.env.BROWSER_PREVIEW;

    console.error('Error in test posting:', error);
    return res.status(500).json({ error: 'Failed to test posting' });
  }
});

// GET /api/posting/logs/:jobId - Get posting logs
router.get('/logs/:jobId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const job = await db.job.findById(jobId);
    if (!job || job.user_id !== userId) {
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