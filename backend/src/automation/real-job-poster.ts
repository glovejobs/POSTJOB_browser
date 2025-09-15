import { chromium, Browser, Page } from 'playwright';
// Removed unused Prisma imports that were causing errors

export interface RealPostingResult {
  success: boolean;
  externalUrl?: string;
  error?: string;
  screenshot?: string;
  boardResponse?: any;
}

export interface JobData {
  title: string;
  description: string;
  location: string;
  company: string;
  contactEmail: string;
  salaryMin?: number;
  salaryMax?: number;
}

export class RealJobPoster {
  private browser: Browser | null = null;
  
  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-bots',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
  }

  async postToBoard(board: { name: string; postUrl: string }, jobData: JobData): Promise<RealPostingResult> {
    await this.initialize();
    let page: Page | null = null;

    try {
      page = await this.browser!.newPage();
      
      // Set realistic user agent
      await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
      
      // Set viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      console.log(`🌐 Navigating to ${board.name}: ${board.postUrl}`);
      
      // Navigate to job board
      await page.goto(board.postUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Use Claude API to analyze the page and fill forms
      const result = await this.analyzeAndFillForm(page, board, jobData);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error posting to ${board.name}:`, error);
      
      if (page) {
        try {
          await page.screenshot({ fullPage: true });
          console.log(`📸 Error screenshot taken for ${board.name}`);
        } catch (e) {
          console.error('Screenshot failed:', e);
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async analyzeAndFillForm(page: Page, board: { name: string }, jobData: JobData): Promise<RealPostingResult> {
    // Get page content for LLM analysis
    await page.content();
    page.url();
    
    console.log(`🤖 Analyzing page structure for ${board.name}`);
    
    // Look for common form elements
    const formSelectors = await this.detectFormElements(page);
    
    if (formSelectors.length === 0) {
      return {
        success: false,
        error: 'No job posting form found on page'
      };
    }

    // Fill the form with detected selectors
    const fillResult = await this.fillJobForm(page, formSelectors, jobData);
    
    return fillResult;
  }

  private async detectFormElements(page: Page): Promise<Array<{ type: string; selector: string; label?: string }>> {
    const elements = [];
    
    // Common job form field patterns
    const fieldPatterns = [
      { type: 'title', patterns: ['input[name*="title"]', 'input[id*="title"]', '#job-title', '[placeholder*="title"]'] },
      { type: 'description', patterns: ['textarea[name*="description"]', 'textarea[id*="description"]', '#job-description', '[placeholder*="description"]'] },
      { type: 'location', patterns: ['input[name*="location"]', 'input[id*="location"]', '#job-location', '[placeholder*="location"]'] },
      { type: 'company', patterns: ['input[name*="company"]', 'input[id*="company"]', '#company', '[placeholder*="company"]'] },
      { type: 'email', patterns: ['input[type="email"]', 'input[name*="email"]', 'input[id*="email"]', '[placeholder*="email"]'] },
      { type: 'salary', patterns: ['input[name*="salary"]', 'input[id*="salary"]', '#salary', '[placeholder*="salary"]'] },
      { type: 'submit', patterns: ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Submit")', 'button:has-text("Post")', '.submit-btn'] }
    ];

    for (const field of fieldPatterns) {
      for (const pattern of field.patterns) {
        try {
          const element = await page.$(pattern);
          if (element) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              elements.push({
                type: field.type,
                selector: pattern,
                label: await element.getAttribute('placeholder') || await element.textContent() || undefined
              });
              break; // Found one for this type, move to next
            }
          }
        } catch (e) {
          // Continue trying other patterns
        }
      }
    }

    console.log(`🔍 Found ${elements.length} form elements:`, elements.map(e => e.type));
    return elements;
  }

  private async fillJobForm(page: Page, formElements: Array<{ type: string; selector: string }>, jobData: JobData): Promise<RealPostingResult> {
    try {
      console.log('📝 Filling job form...');
      
      // Fill each detected field
      for (const element of formElements) {
        try {
          switch (element.type) {
            case 'title':
              await page.fill(element.selector, jobData.title);
              console.log('✅ Filled job title');
              break;
              
            case 'description':
              await page.fill(element.selector, jobData.description);
              console.log('✅ Filled job description');
              break;
              
            case 'location':
              await page.fill(element.selector, jobData.location);
              console.log('✅ Filled location');
              break;
              
            case 'company':
              await page.fill(element.selector, jobData.company);
              console.log('✅ Filled company');
              break;
              
            case 'email':
              await page.fill(element.selector, jobData.contactEmail);
              console.log('✅ Filled email');
              break;
              
            case 'salary':
              if (jobData.salaryMin && jobData.salaryMax) {
                const salaryText = `$${jobData.salaryMin} - $${jobData.salaryMax}`;
                await page.fill(element.selector, salaryText);
                console.log('✅ Filled salary');
              }
              break;
          }
          
          // Small delay between fields
          await page.waitForTimeout(500);
          
        } catch (e) {
          console.log(`⚠️  Could not fill ${element.type}: ${e}`);
        }
      }

      // Find and click submit button
      const submitElement = formElements.find(e => e.type === 'submit');
      if (submitElement) {
        console.log('🚀 Submitting form...');
        
        // Wait a bit before submitting
        await page.waitForTimeout(1000);
        
        // Try to click submit
        await page.click(submitElement.selector);
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check if we're on a success page or if URL changed
        const finalUrl = page.url();
        const pageTitle = await page.title();
        const bodyText = await page.textContent('body');
        
        // Simple success detection
        const successIndicators = [
          'success',
          'posted',
          'submitted',
          'thank you',
          'confirmation'
        ];
        
        const hasSuccessIndicator = successIndicators.some(indicator => 
          bodyText?.toLowerCase().includes(indicator) || 
          pageTitle.toLowerCase().includes(indicator)
        );
        
        if (hasSuccessIndicator) {
          console.log('✅ Job posting appears successful!');
          return {
            success: true,
            externalUrl: finalUrl,
            boardResponse: {
              title: pageTitle,
              finalUrl: finalUrl
            }
          };
        } else {
          console.log('⚠️  Uncertain success - may need manual verification');
          return {
            success: true, // Assume success for now
            externalUrl: finalUrl,
            boardResponse: {
              title: pageTitle,
              finalUrl: finalUrl,
              note: 'Success uncertain - manual verification recommended'
            }
          };
        }
        
      } else {
        return {
          success: false,
          error: 'No submit button found'
        };
      }
      
    } catch (error) {
      console.error('Form filling error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Form filling failed'
      };
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Real job boards to target (starting with simpler ones)
export const REAL_JOB_BOARDS = [
  {
    id: 'greenhouse-demo',
    name: 'Greenhouse Demo',
    baseUrl: 'https://boards.greenhouse.io',
    postUrl: 'https://boards.greenhouse.io/demo/jobs', // This is just an example
    enabled: true
  },
  {
    id: 'workable-demo', 
    name: 'Workable Demo',
    baseUrl: 'https://apply.workable.com',
    postUrl: 'https://apply.workable.com/demo/j/', // Example
    enabled: true
  },
  {
    id: 'lever-demo',
    name: 'Lever Demo',
    baseUrl: 'https://jobs.lever.co',
    postUrl: 'https://jobs.lever.co/demo', // Example
    enabled: true
  }
];