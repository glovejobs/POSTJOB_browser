import { browserService, JobData, PostingResult } from './browser.service';
import { createPostingStrategy } from './posting-strategies';
import db from './database.service';

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
      // Initialize browser with retry logic
      console.log(`📋 Initializing browser for ${boardName}...`);
      await browserService.initialize();

      // Small delay to ensure browser is ready
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      const job = await db.job.findById(jobId, true);

      if (!job) {
        throw new Error('Job not found');
      }

      // Get user details
      const user = await db.user.findById(job.user_id);
      if (!user) {
        throw new Error('User not found');
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
      const enabledBoards = (job.postings || [])
        .filter((posting: any) => posting.board.enabled)
        .map((posting: any) => posting.board.name);

      if (enabledBoards.length === 0) {
        throw new Error('No enabled boards found for this job');
      }

      // Get credentials (in production, these would be encrypted/secured)
      const credentials: PostingCredentials = {
        email: user?.email || '',
        password: process.env.DEFAULT_POSTING_PASSWORD || 'demo-password',
        company: job.company
      };

      // Post to all boards
      const results = await this.postToMultipleBoards(enabledBoards, jobData, credentials);

      // Update database with results
      for (const result of results) {
        const posting = (job.postings || []).find(
          (p: any) => p.board?.name?.toLowerCase() === result.boardName.toLowerCase()
        );

        if (posting) {
          await db.jobPosting.update(posting.id, {
            status: result.success ? 'completed' : 'failed',
            externalUrl: result.externalUrl || null,
            errorMessage: result.errorMessage || null,
            postedAt: result.success ? new Date().toISOString() : null
          });
        }
      }

      // Update job status
      const allSuccess = results.every((r: any) => r.success);
      const allFailed = results.every((r: any) => !r.success);

      await db.job.update(jobId, {
        status: allSuccess ? 'completed' : allFailed ? 'failed' : 'partial'
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
      // Get job details
      const job = await db.job.findById(jobId, true);
      if (!job) {
        throw new Error('Job not found');
      }

      // Get user details
      const user = await db.user.findById(job.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Get failed postings
      const failedPostings = (job.postings || []).filter(
        (p: any) => p.status === 'failed' && p.board?.enabled
      );

      if (failedPostings.length === 0) {
        return [];
      }
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
        email: user?.email || '',
        password: process.env.DEFAULT_POSTING_PASSWORD || 'demo-password',
        company: job.company
      };

      // Retry each failed posting
      const results: BoardPostingResult[] = [];
      for (const posting of failedPostings) {
        if (posting.board.enabled) {
          console.log(`🔄 Retrying ${posting.board.name}...`);
          const result = await this.postToBoard(
            posting.board.name,
            jobData,
            credentials
          );
          results.push(result);

          // Update database
          await db.jobPosting.update(posting.id, {
            status: result.success ? 'completed' : 'failed',
            externalUrl: result.externalUrl || null,
            errorMessage: result.errorMessage || null,
            postedAt: result.success ? new Date().toISOString() : null
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