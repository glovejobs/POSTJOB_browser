import { chromium, Browser, Page } from 'playwright';
// Using local types instead of Prisma client types due to generation issues
interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  company: string;
  contactEmail: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

interface JobBoard {
  id: string;
  name: string;
  baseUrl: string;
  postUrl: string;
  selectors: any;
  enabled: boolean;
}
import path from 'path';
import fs from 'fs/promises';

export interface PostingResult {
  success: boolean;
  externalUrl?: string;
  error?: string;
  screenshot?: string;
}

interface BoardSelectors {
  title: string;
  description: string;
  location: string;
  submit: string;
  salary?: string;
  company?: string;
  email?: string;
}

export class JobPoster {
  private browser: Browser | null = null;
  
  async postToBoard(board: JobBoard, job: Job): Promise<PostingResult> {
    let page: Page | null = null;
    
    try {
      // Launch browser if not already launched
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        });
      }
      
      // Create new page
      page = await this.browser.newPage();
      
      // Set timeout
      page.setDefaultTimeout(120000); // 2 minutes
      
      // Navigate to board post URL
      console.log(`Navigating to ${board.postUrl}`);
      await page.goto(board.postUrl, { waitUntil: 'networkidle' });
      
      // Parse selectors
      const selectors = board.selectors as BoardSelectors;
      
      // Fill in job details
      await this.fillForm(page, selectors, job);
      
      // Take screenshot before submitting
      await this.takeScreenshot(page, job.id, board.name, 'before-submit');
      
      // Submit form
      console.log(`Submitting form on ${board.name}`);
      await page.click(selectors.submit);
      
      // Wait for navigation or success indicator
      await this.waitForSuccess(page, board);
      
      // Get the current URL (might be the job posting URL)
      const currentUrl = page.url();
      
      // Take success screenshot
      await this.takeScreenshot(page, job.id, board.name, 'success');
      
      // Extract external URL if available
      const externalUrl = this.extractJobUrl(currentUrl, board.baseUrl);
      
      return {
        success: true,
        externalUrl
      };
      
    } catch (error) {
      console.error(`Error posting to ${board.name}:`, error);
      
      // Try to take error screenshot
      if (page) {
        try {
          await this.takeScreenshot(page, job.id, board.name, 'error');
        } catch (screenshotError) {
          console.error('Failed to take error screenshot:', screenshotError);
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
    } finally {
      // Close page
      if (page) {
        await page.close();
      }
    }
  }
  
  private async fillForm(page: Page, selectors: BoardSelectors, job: Job) {
    // Fill title
    await page.fill(selectors.title, job.title);
    
    // Fill description
    await page.fill(selectors.description, job.description);
    
    // Fill location
    await page.fill(selectors.location, job.location);
    
    // Fill company if selector exists
    if (selectors.company) {
      await page.fill(selectors.company, job.company);
    }
    
    // Fill email if selector exists
    if (selectors.email) {
      await page.fill(selectors.email, job.contactEmail);
    }
    
    // Fill salary if selector exists and salary is provided
    if (selectors.salary && (job.salaryMin || job.salaryMax)) {
      const salaryText = this.formatSalary(job.salaryMin, job.salaryMax);
      await page.fill(selectors.salary, salaryText);
    }
    
    // Wait a bit to ensure all fields are filled
    await page.waitForTimeout(1000);
  }
  
  private formatSalary(min?: number | null, max?: number | null): string {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    } else if (min) {
      return `$${min.toLocaleString()}+`;
    } else if (max) {
      return `Up to $${max.toLocaleString()}`;
    }
    return '';
  }
  
  private async waitForSuccess(page: Page, board: JobBoard) {
    // Wait for navigation or specific success indicators
    // This is a generic implementation - customize per board as needed
    
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.waitForSelector('.success-message', { timeout: 30000 }),
        page.waitForSelector('#success', { timeout: 30000 }),
        page.waitForTimeout(10000) // Fallback timeout
      ]);
    } catch (error) {
      // Continue even if we timeout - check if form is no longer visible
      const selectors = board.selectors as BoardSelectors;
      const formVisible = await page.isVisible(selectors.submit).catch(() => false);
      
      if (formVisible) {
        throw new Error('Form submission appears to have failed - submit button still visible');
      }
    }
  }
  
  private extractJobUrl(currentUrl: string, baseUrl: string): string | undefined {
    // If we're on a different page than the post URL, it might be the job listing
    if (!currentUrl.includes('/post') && currentUrl.startsWith(baseUrl)) {
      return currentUrl;
    }
    
    // Some boards might redirect to a job ID URL
    const jobIdMatch = currentUrl.match(/job[/-]?(\d+)/i);
    if (jobIdMatch) {
      return currentUrl;
    }
    
    return undefined;
  }
  
  private async takeScreenshot(page: Page, jobId: string, boardName: string, type: string): Promise<string> {
    const dir = path.join(process.cwd(), 'screenshots', jobId);
    await fs.mkdir(dir, { recursive: true });
    
    const filename = `${boardName.toLowerCase().replace(/\s+/g, '-')}-${type}.png`;
    const filepath = path.join(dir, filename);
    
    await page.screenshot({ path: filepath, fullPage: true });
    
    return filepath;
  }
  
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}