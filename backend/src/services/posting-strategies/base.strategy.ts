import { Page } from 'playwright';
import { JobData, PostingResult } from '../browser.service';

export abstract class BasePostingStrategy {
  protected boardName: string;
  protected loginUrl: string;
  protected postUrl: string;
  protected selectors: Record<string, any>;

  constructor(
    boardName: string,
    loginUrl: string,
    postUrl: string,
    selectors: Record<string, any>
  ) {
    this.boardName = boardName;
    this.loginUrl = loginUrl;
    this.postUrl = postUrl;
    this.selectors = selectors;
  }

  abstract login(page: Page, credentials: any): Promise<boolean>;
  abstract fillJobForm(page: Page, jobData: JobData): Promise<void>;
  abstract submitJob(page: Page): Promise<PostingResult>;

  async post(page: Page, jobData: JobData, credentials: any): Promise<PostingResult> {
    try {
      console.log(`📋 Starting job posting to ${this.boardName}`);

      // Step 1: Login
      console.log(`🔐 Logging in to ${this.boardName}...`);
      const loginSuccess = await this.login(page, credentials);
      if (!loginSuccess) {
        throw new Error('Failed to login');
      }

      // Step 2: Navigate to job posting page
      console.log(`📝 Navigating to job posting form...`);
      await page.goto(this.postUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Step 3: Fill job form
      console.log(`✏️ Filling job details...`);
      await this.fillJobForm(page, jobData);

      // Step 4: Submit job
      console.log(`🚀 Submitting job posting...`);
      const result = await this.submitJob(page);

      if (result.success) {
        console.log(`✅ Successfully posted to ${this.boardName}`);
      } else {
        console.log(`❌ Failed to post to ${this.boardName}: ${result.errorMessage}`);
      }

      return result;
    } catch (error: any) {
      console.error(`❌ Error posting to ${this.boardName}:`, error);
      
      // Take screenshot on error
      let screenshot: Buffer | undefined;
      try {
        screenshot = await page.screenshot({ fullPage: true });
      } catch {}

      return {
        success: false,
        errorMessage: error.message || 'Unknown error occurred',
        screenshot
      };
    }
  }

  protected formatSalary(min?: number, max?: number): string {
    if (!min && !max) return 'Competitive';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    } else if (min) {
      return `${formatter.format(min)}+`;
    } else if (max) {
      return `Up to ${formatter.format(max)}`;
    }
    
    return 'Competitive';
  }

  protected formatDescription(jobData: JobData): string {
    let description = jobData.description;

    // Add company info if not already in description
    if (!description.toLowerCase().includes(jobData.company.toLowerCase())) {
      description = `Company: ${jobData.company}\n\n${description}`;
    }

    // Add contact info
    description += `\n\nTo apply, please contact: ${jobData.contactEmail}`;

    // Add department if available
    if (jobData.department) {
      description = `Department: ${jobData.department}\n\n${description}`;
    }

    return description;
  }

  protected async waitForElement(page: Page, selector: string, timeout: number = 30000): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  protected async safeClick(page: Page, selector: string): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      await page.click(selector);
      return true;
    } catch (error) {
      console.error(`Failed to click ${selector}:`, error);
      return false;
    }
  }

  protected async safeFill(page: Page, selector: string, value: string): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      await page.fill(selector, value);
      return true;
    } catch (error) {
      console.error(`Failed to fill ${selector}:`, error);
      return false;
    }
  }
}