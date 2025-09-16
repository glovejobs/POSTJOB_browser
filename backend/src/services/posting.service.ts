import { browserService, JobData, PostingResult } from './browser.service';
import { createPostingStrategy } from './posting-strategies';
import prisma from '../database/prisma';

interface PostingCredentials {
  username?: string;
  email?: string;
  password: string;
  company?: string;
}

interface BoardPostingResult extends PostingResult {
  boardId: string;
  boardName: string;
}

export class PostingService {
  /**
   * Post a job to a specific board
   */
  async postToBoard(
    boardName: string,
    jobData: JobData,
    credentials: PostingCredentials
  ): Promise<BoardPostingResult> {
    const strategy = createPostingStrategy(boardName);
    
    if (!strategy) {
      return {
        success: false,
        boardId: boardName,
        boardName,
        errorMessage: `No posting strategy available for ${boardName}`
      };
    }

    let page;
    try {
      // Initialize browser if needed
      await browserService.initialize();
      
      // Create a new page
      page = await browserService.createPage();
      
      // Handle cookie consent
      await browserService.handleCookieConsent(page);
      
      // Execute posting strategy
      const result = await strategy.post(page, jobData, credentials);
      
      return {
        ...result,
        boardId: boardName,
        boardName
      };
    } catch (error: any) {
      console.error(`Error posting to ${boardName}:`, error);
      
      let screenshot: Buffer | undefined;
      if (page) {
        try {
          screenshot = await browserService.takeScreenshot(page, `error-${boardName}`);
        } catch {}
      }
      
      return {
        success: false,
        boardId: boardName,
        boardName,
        errorMessage: error.message || 'Unknown error occurred',
        screenshot
      };
    } finally {
      // Close the page
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Post a job to multiple boards
   */
  async postToMultipleBoards(
    boardNames: string[],
    jobData: JobData,
    credentials: PostingCredentials
  ): Promise<BoardPostingResult[]> {
    const results: BoardPostingResult[] = [];
    
    // Post to each board sequentially to avoid overwhelming the system
    for (const boardName of boardNames) {
      console.log(`\n📋 Posting to ${boardName}...`);
      const result = await this.postToBoard(boardName, jobData, credentials);
      results.push(result);
      
      // Add a delay between postings
      if (boardName !== boardNames[boardNames.length - 1]) {
        console.log('⏳ Waiting before next posting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    return results;
  }

  /**
   * Process a job posting from the database
   */
  async processJobPosting(jobId: string): Promise<BoardPostingResult[]> {
    try {
      // Fetch job details with boards
      const job = await prisma.postjob_jobs.findUnique({
        where: { id: jobId },
        include: {
          postjob_users: true,
          job_postings: {
            include: {
              job_boards: true
            }
          }
        }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Prepare job data
      const jobData: JobData = {
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

      // Get enabled boards
      const enabledBoards = job.job_postings
        .filter((posting: any) => posting.job_boards.enabled)
        .map((posting: any) => posting.job_boards.name);

      if (enabledBoards.length === 0) {
        throw new Error('No enabled boards found for this job');
      }

      // Get credentials (in production, these would be encrypted/secured)
      const credentials: PostingCredentials = {
        email: job.postjob_users.email,
        password: process.env.DEFAULT_POSTING_PASSWORD || 'demo-password',
        company: job.company
      };

      // Post to all boards
      const results = await this.postToMultipleBoards(enabledBoards, jobData, credentials);

      // Update database with results
      for (const result of results) {
        const posting = job.job_postings.find(
          (p: any) => p.job_boards.name.toLowerCase() === result.boardName.toLowerCase()
        );

        if (posting) {
          await prisma.job_postings.update({
            where: { id: posting.id },
            data: {
              status: result.success ? 'completed' : 'failed',
              external_url: result.externalUrl || null,
              error_message: result.errorMessage || null,
              posted_at: result.success ? new Date() : null,
              updated_at: new Date()
            }
          });
        }
      }

      // Update job status
      const allSuccess = results.every((r: any) => r.success);
      const allFailed = results.every((r: any) => !r.success);

      await prisma.postjob_jobs.update({
        where: { id: jobId },
        data: {
          status: allSuccess ? 'completed' : allFailed ? 'failed' : 'partial',
          updated_at: new Date()
        }
      });

      return results;
    } catch (error: any) {
      console.error('Error processing job posting:', error);
      throw error;
    }
  }

  /**
   * Retry failed postings for a job
   */
  async retryFailedPostings(jobId: string): Promise<BoardPostingResult[]> {
    try {
      // Get failed postings
      const failedPostings = await prisma.job_postings.findMany({
        where: {
          job_id: jobId,
          status: 'failed'
        },
        include: {
          job_boards: true,
          postjob_jobs: {
            include: {
              postjob_users: true
            }
          }
        }
      });

      if (failedPostings.length === 0) {
        return [];
      }

      // Prepare job data from the first posting
      const job = failedPostings[0].postjob_jobs;
      const jobData: JobData = {
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

      const credentials: PostingCredentials = {
        email: job.postjob_users.email,
        password: process.env.DEFAULT_POSTING_PASSWORD || 'demo-password',
        company: job.company
      };

      // Retry each failed posting
      const results: BoardPostingResult[] = [];
      for (const posting of failedPostings) {
        if (posting.job_boards.enabled) {
          console.log(`🔄 Retrying ${posting.job_boards.name}...`);
          const result = await this.postToBoard(
            posting.job_boards.name,
            jobData,
            credentials
          );
          results.push(result);

          // Update database
          await prisma.job_postings.update({
            where: { id: posting.id },
            data: {
              status: result.success ? 'completed' : 'failed',
              external_url: result.externalUrl || null,
              error_message: result.errorMessage || null,
              posted_at: result.success ? new Date() : null,
              updated_at: new Date()
            }
          });

          // Delay between retries
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      return results;
    } catch (error: any) {
      console.error('Error retrying failed postings:', error);
      throw error;
    }
  }

  /**
   * Close browser service
   */
  async close(): Promise<void> {
    await browserService.close();
  }
}

// Singleton instance
export const postingService = new PostingService();