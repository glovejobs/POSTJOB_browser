import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { config } from '../config/environment';

export interface PostingResult {
  success: boolean;
  externalUrl?: string;
  errorMessage?: string;
  screenshot?: Buffer;
}

export interface JobData {
  title: string;
  description: string;
  location: string;
  company: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  department?: string;
  contactEmail: string;
}

export class BrowserService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      console.log('🚀 Launching browser...');

      // Add retry logic for browser initialization
      let retries = 3;
      while (retries > 0) {
        try {
          this.browser = await chromium.launch({
            headless: config.NODE_ENV === 'production' && !process.env.BROWSER_PREVIEW,
            slowMo: process.env.BROWSER_PREVIEW ? 1000 : 0, // Slow down for demo
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu'
            ]
          });

          this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ignoreHTTPSErrors: true,
          });

          console.log('✅ Browser initialized successfully');
          break;
        } catch (error) {
          console.error(`❌ Browser initialization failed (${3 - retries + 1}/3):`, error);
          retries--;

          if (retries === 0) {
            throw new Error('Failed to initialize browser after 3 attempts');
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async createPage(): Promise<Page> {
    if (!this.context) {
      await this.initialize();
    }

    // Add small delay to ensure browser is ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    const page = await this.context!.newPage();

    // Set increased timeouts for better reliability
    page.setDefaultTimeout(60000); // 60 seconds
    page.setDefaultNavigationTimeout(60000);

    // Less aggressive resource blocking - only block media and large images
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      const url = route.request().url();

      // Only block media and very large images, allow CSS/fonts for proper rendering
      if (resourceType === 'media' ||
          (resourceType === 'image' && url.includes('banner')) ||
          (resourceType === 'image' && url.includes('hero'))) {
        route.abort();
      } else {
        route.continue();
      }
    });

    return page;
  }

  async takeScreenshot(page: Page, _name: string): Promise<Buffer> {
    return await page.screenshot({
      fullPage: true,
      type: 'png',
    });
  }

  async fillForm(page: Page, selectors: Record<string, string>, data: Record<string, string>): Promise<void> {
    for (const [field, selector] of Object.entries(selectors)) {
      if (data[field] && selector) {
        try {
          // Wait for the field to be visible
          await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
          
          // Clear and fill the field
          await page.fill(selector, data[field]);
          
          // Small delay between fields
          await page.waitForTimeout(500);
        } catch (error) {
          console.error(`Failed to fill field ${field} with selector ${selector}:`, error);
          throw new Error(`Failed to fill form field: ${field}`);
        }
      }
    }
  }

  async selectOption(page: Page, selector: string, value: string): Promise<void> {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      await page.selectOption(selector, value);
    } catch (error) {
      console.error(`Failed to select option ${value} in ${selector}:`, error);
      throw new Error(`Failed to select option: ${value}`);
    }
  }

  async clickAndWaitForNavigation(page: Page, selector: string): Promise<void> {
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click(selector)
      ]);
    } catch (error) {
      console.error(`Failed to click and navigate with selector ${selector}:`, error);
      throw new Error(`Failed to click and navigate: ${selector}`);
    }
  }

  async waitForSuccessIndicator(page: Page, indicators: string[]): Promise<string | null> {
    try {
      // Wait for any of the success indicators
      const result = await Promise.race(
        indicators.map(async (indicator) => {
          try {
            await page.waitForSelector(indicator, { state: 'visible', timeout: 30000 });
            return indicator;
          } catch {
            return null;
          }
        })
      );
      return result;
    } catch (error) {
      console.error('No success indicator found:', error);
      return null;
    }
  }

  async extractJobUrl(page: Page, selectors: string[]): Promise<string | null> {
    for (const selector of selectors) {
      try {
        // Try to find a link with the job ID or confirmation
        const element = await page.$(selector);
        if (element) {
          const href = await element.getAttribute('href');
          if (href) {
            // Convert relative URLs to absolute
            const url = new URL(href, page.url());
            return url.toString();
          }
        }
      } catch (error) {
        console.error(`Failed to extract URL with selector ${selector}:`, error);
      }
    }

    // If no URL found, return current page URL if it looks like a job posting
    const currentUrl = page.url();
    if (currentUrl.includes('/job/') || currentUrl.includes('/posting/') || currentUrl.includes('id=')) {
      return currentUrl;
    }

    return null;
  }

  async handleCookieConsent(page: Page): Promise<void> {
    // Common cookie consent selectors
    const consentSelectors = [
      'button:has-text("Accept")',
      'button:has-text("Accept all")',
      'button:has-text("Accept cookies")',
      'button:has-text("I agree")',
      '.cookie-consent button',
      '#cookie-accept',
      '[data-action="accept"]'
    ];

    for (const selector of consentSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await page.waitForTimeout(1000);
          break;
        }
      } catch {
        // Ignore errors, cookie consent might not exist
      }
    }
  }

  async debugPage(page: Page, stepName: string): Promise<void> {
    if (config.NODE_ENV !== 'production') {
      console.log(`\n🔍 Debug - ${stepName}`);
      console.log(`URL: ${page.url()}`);
      console.log(`Title: ${await page.title()}`);
      
      // Log any visible error messages
      const errorSelectors = ['.error', '.alert-danger', '[role="alert"]', '.error-message'];
      for (const selector of errorSelectors) {
        const error = await page.$(selector);
        if (error) {
          const text = await error.textContent();
          console.log(`⚠️ Error found: ${text}`);
        }
      }
    }
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 2000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${i + 1} failed: ${lastError.message}`);
        
        if (i < maxRetries - 1) {
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }
}

// Singleton instance
export const browserService = new BrowserService();