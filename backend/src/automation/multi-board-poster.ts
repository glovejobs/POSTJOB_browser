import { chromium, Browser, Page } from 'playwright';
import { LLMManager, createLLMManager } from '../llm/llm-manager';
import { REAL_JOB_BOARDS } from './real-job-boards';
import { JobData } from '../llm/types';

export interface JobPostingResult {
  boardId: string;
  boardName: string;
  success: boolean;
  externalUrl?: string;
  error?: string;
  screenshot?: string;
  llmAnalysis?: any;
  postingTime: number;
  cost?: number;
}

export interface MultiPostingResults {
  jobId: string;
  overallSuccess: boolean;
  totalBoards: number;
  successfulPostings: number;
  failedPostings: number;
  results: JobPostingResult[];
  totalCost: number;
  totalTime: number;
}

export class MultiBoardJobPoster {
  private browser: Browser | null = null;
  private llmManager: LLMManager;
  private maxConcurrentPosts: number = 3;

  constructor(llmManager?: LLMManager) {
    this.llmManager = llmManager || createLLMManager({
      provider: 'groq',
      apiKey: process.env.GROQ_API_KEY || 'demo-key',
      model: 'llama-3.1-8b-instant',
      fallbackProvider: 'openai',
      fallbackApiKey: process.env.OPENAI_API_KEY,
      costLimit: 0.05 // Max 5 cents per job posting
    });
  }

  async initialize() {
    if (!this.browser) {
      console.log('🚀 Initializing browser for multi-board posting...');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-bots',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"'
        ]
      });
    }
  }

  async postJobToAllBoards(jobData: JobData, selectedBoardIds?: string[]): Promise<MultiPostingResults> {
    const startTime = Date.now();
    
    // Filter boards based on selection or use all enabled boards
    const targetBoards = selectedBoardIds 
      ? REAL_JOB_BOARDS.filter(board => selectedBoardIds.includes(board.id) && board.enabled)
      : REAL_JOB_BOARDS.filter(board => board.enabled);

    console.log(`🎯 Starting job posting to ${targetBoards.length} boards...`);

    await this.initialize();

    // Process boards in batches to avoid overwhelming servers
    const results: JobPostingResult[] = [];
    const batches = this.createBatches(targetBoards, this.maxConcurrentPosts);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} boards)...`);

      const batchPromises = batch.map(board => this.postToSingleBoard(board, jobData));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            boardId: batch[index].id,
            boardName: batch[index].name,
            success: false,
            error: `Batch processing failed: ${result.reason}`,
            postingTime: 0
          });
        }
      });

      // Brief pause between batches to be respectful to servers
      if (i < batches.length - 1) {
        await this.sleep(2000);
      }
    }

    // Calculate final statistics
    const successfulPostings = results.filter(r => r.success).length;
    const failedPostings = results.length - successfulPostings;
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalTime = Date.now() - startTime;

    const finalResults: MultiPostingResults = {
      jobId: jobData.id || `job-${Date.now()}`,
      overallSuccess: successfulPostings > 0,
      totalBoards: results.length,
      successfulPostings,
      failedPostings,
      results,
      totalCost,
      totalTime
    };

    console.log(`✅ Multi-board posting completed:`, {
      success: `${successfulPostings}/${results.length}`,
      time: `${totalTime}ms`,
      cost: `$${totalCost.toFixed(4)}`
    });

    return finalResults;
  }

  private async postToSingleBoard(board: any, jobData: JobData): Promise<JobPostingResult> {
    const startTime = Date.now();
    let page: Page | null = null;
    
    try {
      console.log(`🔄 Posting to ${board.name}...`);
      
      page = await this.browser!.newPage();
      
      // Set realistic headers and user agent
      await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // Navigate to job posting page
      console.log(`📍 Navigating to ${board.post_url}...`);
      await page.goto(board.post_url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for page to be ready
      await page.waitForTimeout(2000);
      
      // Get page HTML for LLM analysis
      const htmlContent = await page.content();
      
      // Use LLM to analyze form and generate selectors
      console.log(`🤖 Analyzing form with LLM...`);
      const llmAnalysis = await this.llmManager.analyzeJobForm(
        htmlContent,
        board.post_url,
        board.name
      );
      
      if (!llmAnalysis.success || llmAnalysis.confidence < 0.7) {
        throw new Error(`LLM analysis failed or low confidence: ${llmAnalysis.confidence}`);
      }
      
      // Fill form using LLM-generated selectors
      const selectors = llmAnalysis.selectors;
      
      // Fill job title
      if (selectors.title) {
        await this.fillField(page, selectors.title, jobData.title);
      }
      
      // Fill job description  
      if (selectors.description) {
        await this.fillField(page, selectors.description, jobData.description);
      }
      
      // Fill location
      if (selectors.location) {
        await this.fillField(page, selectors.location, jobData.location);
      }
      
      // Fill company
      if (selectors.company) {
        await this.fillField(page, selectors.company, jobData.company);
      }
      
      // Fill email
      if (selectors.email && jobData.contactEmail) {
        await this.fillField(page, selectors.email, jobData.contactEmail);
      }
      
      // Fill salary if available
      if (selectors.salary && jobData.salaryMin) {
        const salaryText = jobData.salaryMax 
          ? `$${jobData.salaryMin} - $${jobData.salaryMax}`
          : `$${jobData.salaryMin}+`;
        await this.fillField(page, selectors.salary, salaryText);
      }
      
      // Submit form
      if (selectors.submit) {
        console.log(`📤 Submitting job to ${board.name}...`);
        
        // Take screenshot before submission
        const beforeScreenshot = await page.screenshot({ 
          fullPage: true, 
          type: 'png' 
        });
        
        await page.click(selectors.submit);
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check for success indicators
        const currentUrl = page.url();
        const pageText = await page.textContent('body');
        
        // Try to extract job URL if successful
        let externalUrl = currentUrl;
        if (llmAnalysis.successSelectors?.jobUrl) {
          try {
            const jobUrlElement = await page.$(llmAnalysis.successSelectors.jobUrl);
            if (jobUrlElement) {
              externalUrl = await jobUrlElement.getAttribute('href') || currentUrl;
            }
          } catch (e) {
            console.log('Could not extract job URL, using page URL');
          }
        }
        
        const success = this.detectSuccess(pageText, currentUrl, board.post_url);
        
        return {
          boardId: board.id,
          boardName: board.name,
          success,
          externalUrl: success ? externalUrl : undefined,
          llmAnalysis,
          postingTime: Date.now() - startTime,
          cost: llmAnalysis.cost || 0,
          screenshot: beforeScreenshot.toString('base64')
        };
      } else {
        throw new Error('No submit selector found');
      }
      
    } catch (error) {
      console.error(`❌ Failed to post to ${board.name}:`, error);
      
      let screenshot: string | undefined;
      try {
        if (page) {
          const screenshotBuffer = await page.screenshot({ fullPage: true, type: 'png' });
          screenshot = screenshotBuffer.toString('base64');
        }
      } catch (e) {
        console.log('Could not capture error screenshot');
      }
      
      return {
        boardId: board.id,
        boardName: board.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        postingTime: Date.now() - startTime,
        screenshot
      };
    } finally {
      if (page) {
        await page.close().catch(console.error);
      }
    }
  }

  private async fillField(page: Page, selector: string, value: string): Promise<void> {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.fill(selector, value);
      console.log(`✏️  Filled field ${selector} with: ${value.substring(0, 50)}...`);
    } catch (error) {
      console.warn(`⚠️  Could not fill field ${selector}:`, error);
      // Try alternative approaches
      try {
        await page.locator(selector).fill(value);
      } catch (retryError) {
        throw new Error(`Failed to fill ${selector}: ${error}`);
      }
    }
  }

  private detectSuccess(pageText: string | null, currentUrl: string, originalUrl: string): boolean {
    if (!pageText) return false;
    
    const successIndicators = [
      'success',
      'posted',
      'submitted',
      'published',
      'thank you',
      'confirmation',
      'job created',
      'listing created'
    ];
    
    const errorIndicators = [
      'error',
      'failed',
      'invalid',
      'required',
      'please try again'
    ];
    
    const lowerPageText = pageText.toLowerCase();
    
    // Check for error indicators first
    if (errorIndicators.some(indicator => lowerPageText.includes(indicator))) {
      return false;
    }
    
    // Check for success indicators
    if (successIndicators.some(indicator => lowerPageText.includes(indicator))) {
      return true;
    }
    
    // Check if URL changed (often indicates success)
    if (currentUrl !== originalUrl && !currentUrl.includes('error')) {
      return true;
    }
    
    return false;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🧹 Browser cleanup completed');
    }
  }

  // Method to test connectivity to all boards
  async testBoardConnectivity(): Promise<{ board: string; accessible: boolean; responseTime: number }[]> {
    const results = [];
    
    for (const board of REAL_JOB_BOARDS) {
      const startTime = Date.now();
      try {
        const page = await this.browser!.newPage();
        await page.goto(board.post_url, { timeout: 10000 });
        await page.close();
        
        results.push({
          board: board.name,
          accessible: true,
          responseTime: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          board: board.name,
          accessible: false,
          responseTime: Date.now() - startTime
        });
      }
    }
    
    return results;
  }
}

// Factory function for easy initialization
export function createMultiBoardPoster(llmManager?: LLMManager): MultiBoardJobPoster {
  return new MultiBoardJobPoster(llmManager);
}