import { Redis } from 'ioredis';
import db from '../services/database.service';
import { postingService } from '../services/posting.service';
import { io } from '../index';

// Simple in-memory queue implementation for compatibility
class SimpleQueue {
  private jobs: any[] = [];
  private processing = false;

  async add(name: string, data: any, options?: any) {
    const job = {
      id: Date.now().toString(),
      name,
      data,
      attempts: 0,
      maxAttempts: options?.attempts || 3
    };
    this.jobs.push(job);
    this.process();
    return job;
  }

  private async process() {
    if (this.processing || this.jobs.length === 0) return;

    this.processing = true;
    const job = this.jobs.shift();

    try {
      // Add delay before first attempt to ensure system is ready
      if (job.attempts === 0) {
        console.log(`⏳ Preparing to process job ${job.id}...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      await processJob(job.data);
      console.log(`✅ Job ${job.id} completed successfully`);
    } catch (error: any) {
      job.attempts++;
      console.error(`❌ Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`, error.message);

      if (job.attempts < job.maxAttempts) {
        // Calculate backoff delay: 3s, 6s, 12s
        const delay = Math.pow(2, job.attempts) * 3000;
        console.log(`🔄 Retrying job ${job.id} in ${delay / 1000} seconds...`);

        // Retry with exponential backoff
        setTimeout(() => {
          this.jobs.push(job);
          this.process();
        }, delay);
      } else {
        console.error(`💀 Job ${job.id} failed permanently after ${job.maxAttempts} attempts`);
      }
    }

    this.processing = false;
    if (this.jobs.length > 0) {
      setTimeout(() => this.process(), 1000);
    }
  }
}

// Create our simple queue instance
export const jobQueue = new SimpleQueue();

// Process job function
async function processJob(data: { jobId: string }) {
  const { jobId } = data;
  console.log(`Processing job ${jobId}`);

  try {
    // Get job details
    const jobData = await db.job.findById(jobId, true);
    if (!jobData) {
      throw new Error('Job not found');
    }

    // Filter pending postings
    const pendingPostings = (jobData.postings || []).filter(
      (p: any) => p.status === 'pending'
    );

    if (!jobData) {
      throw new Error('Job not found');
    }

    // Send initial update
    io.to(`job-${jobId}`).emit('job-start', {
      job_id: jobId,
      total_boards: pendingPostings.length,
      status: 'posting'
    });

    // Process the job using posting service
    try {
      const results = await postingService.processJobPosting(jobId);

      // Send updates for each result
      for (const result of results) {
        const posting = pendingPostings.find(
          (p: any) => p.board?.name?.toLowerCase() === result.boardName.toLowerCase()
        );

        if (posting) {
          io.to(`job-${jobId}`).emit('job-update', {
            job_id: jobId,
            board_id: posting.board_id,
            board_name: result.boardName,
            status: result.success ? 'success' : 'failed',
            external_url: result.externalUrl,
            error_message: result.errorMessage
          });
        }
      }

      // Check final status
      const hasSuccess = results.some(r => r.success);
      const allSuccess = results.every(r => r.success);

      io.to(`job-${jobId}`).emit('job-complete', {
        job_id: jobId,
        overall_status: allSuccess ? 'completed' : hasSuccess ? 'partial' : 'failed',
        success_count: results.filter(r => r.success).length,
        total_count: results.length
      });

    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);

      // Update all pending postings as failed
      for (const posting of pendingPostings) {
        await db.jobPosting.update(posting.id, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Send error update
      io.to(`job-${jobId}`).emit('job-error', {
        job_id: jobId,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }

  } catch (error) {
    console.error('Job processing error:', error);

    // Update job as failed
    await db.job.update(jobId, { status: 'failed' });

    throw error;
  }
}

// Dummy worker for compatibility
let worker: any = {
  on: (_event: string, _handler: Function) => {
    // No-op for now
  }
};
// Export to avoid unused variable error
export { worker };

export function initQueue() {
  // Try to connect to Redis just for logging
  const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: () => null // Don't retry
  });

  connection.connect().then(async () => {
    try {
      const info = await connection.info('server');
      const versionMatch = info.match(/redis_version:(\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : '0.0.0';
      console.log(`⚠️  Redis ${version} detected - Using simple queue (BullMQ requires Redis 5.0+)`);
    } catch (error) {
      console.log('⚠️  Redis check failed - Using simple queue');
    }
    connection.disconnect();
  }).catch(() => {
    console.log('⚠️  Redis not available - Using simple in-memory queue');
  });

  console.log('Queue worker initialized with simple queue (Redis 3.2 compatible)');
}

// Add job to queue
export async function addJobToQueue(jobId: string) {
  const job = await jobQueue.add('post-job', {
    jobId
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });

  console.log(`Job ${jobId} added to queue with ID ${job.id}`);
  return job;
}