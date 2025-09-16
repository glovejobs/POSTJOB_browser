import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import prisma from '../database/prisma';
import { JobPoster } from '../automation/job-poster';
import { io } from '../index';

// Create Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

// Create queue
export const jobQueue = new Queue('job-posting', {
  connection
});

// Create worker
let worker: Worker;

export function initQueue() {
  worker = new Worker('job-posting', async (job) => {
    const { jobId } = job.data;
    console.log(`Processing job ${jobId}`);
    
    try {
      // Get job details
      const jobData = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          company: true,
          contactEmail: true,
          salaryMin: true,
          salaryMax: true,
          status: true,
          postings: {
            where: { status: 'pending' },
            include: {
              board: true
            }
          }
        }
      });
      
      if (!jobData) {
        throw new Error('Job not found');
      }
      
      // Initialize multi-board job poster with LLM
      const jobPoster = new JobPoster();
      
      // Prepare job data for multi-board posting (removed unused variable)
      
      // Get selected board IDs
      const selectedBoardIds = jobData.postings.map((p: any) => (p as any).board.id);
      
      // Send initial update
      io.to(`job-${jobId}`).emit('job-start', {
        job_id: jobId,
        total_boards: selectedBoardIds.length,
        status: 'posting'
      });
      
      try {
        // Use new multi-board poster for intelligent posting
        console.log(`🚀 Starting multi-board posting for job ${jobId}...`);
        
        // For now, fall back to individual posting until multi-board poster is tested
        // TODO: Replace with: const results = await multiBoardPoster.postJobToAllBoards(jobDataForPosting, selectedBoardIds);
        
        // Post to each board individually with existing system
        for (const posting of jobData.postings as any[]) {
          try {
            // Update posting status to 'posting'
            await prisma.jobPosting.update({
              where: { id: posting.id },
              data: { status: 'posting' }
            });
            
            // Send WebSocket update
            io.to(`job-${jobId}`).emit('job-update', {
              job_id: jobId,
              board_id: posting.boardId,
              board_name: posting.board.name,
              status: 'posting'
            });
            
            // Post to board
            const result = await jobPoster.postToBoard(posting.board, jobData as any);
            
            // Update posting with result
            await prisma.jobPosting.update({
              where: { id: posting.id },
              data: {
                status: result.success ? 'success' : 'failed',
                externalUrl: result.externalUrl,
                errorMessage: result.error,
                postedAt: result.success ? new Date() : null
              }
            });
            
            // Send WebSocket update
            io.to(`job-${jobId}`).emit('job-update', {
              job_id: jobId,
              board_id: posting.boardId,
              board_name: posting.board.name,
              status: result.success ? 'success' : 'failed',
              external_url: result.externalUrl,
              error_message: result.error
            });
            
          } catch (error) {
            console.error(`Error posting to board ${posting.board.name}:`, error);
            
            // Update posting as failed
            await prisma.jobPosting.update({
              where: { id: posting.id },
              data: {
                status: 'failed',
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
              }
            });
            
            // Send WebSocket update
            io.to(`job-${jobId}`).emit('job-update', {
              job_id: jobId,
              board_id: posting.boardId,
              board_name: posting.board.name,
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } catch (error) {
        console.error('Multi-board posting error:', error);
        throw error;
      }
      
      // Check if all postings are complete
      const allPostings = await prisma.jobPosting.findMany({
        where: { jobId }
      });
      
      const allComplete = allPostings.every(p => 
        (p as any).status === 'success' || (p as any).status === 'failed'
      );
      
      if (allComplete) {
        const hasSuccess = allPostings.some(p => (p as any).status === 'success');
        
        // Update job status
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: hasSuccess ? 'completed' : 'failed'
          }
        });
        
        // Send final WebSocket update
        io.to(`job-${jobId}`).emit('job-complete', {
          job_id: jobId,
          overall_status: hasSuccess ? 'completed' : 'failed',
          success_count: allPostings.filter(p => (p as any).status === 'success').length,
          total_count: allPostings.length
        });
      }
      
    } catch (error) {
      console.error('Job processing error:', error);
      
      // Update job as failed
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'failed' }
      });
      
      throw error;
    }
  }, {
    connection,
    concurrency: 2, // Process 2 jobs at a time
    removeOnComplete: {
      count: 100
    },
    removeOnFail: {
      count: 50
    }
  });
  
  // Worker event handlers
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
  
  console.log('Queue worker initialized');
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
    },
    removeOnComplete: true,
    removeOnFail: false
  });
  
  console.log(`Job ${jobId} added to queue with ID ${job.id}`);
  return job;
}