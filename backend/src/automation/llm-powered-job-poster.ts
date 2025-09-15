import { chromium, Browser, Page } from 'playwright';
import { LLMManager, createLLMManager } from '../llm/llm-manager';
import { FormField, JobData } from '../llm/types';

export interface LLMPostingResult {
  success: boolean;
  externalUrl?: string;
  error?: string;
  screenshot?: string;
  formAnalysis?: any;
  llmCost?: number;
  llmProvider?: string;
  responseTime?: number;
}

export interface JobBoard {
  id: string;
  name: string;
  postUrl: string;
  baseUrl: string;
}

export class LLMPoweredJobPoster {
  private browser: Browser | null = null;
  private llmManager: LLMManager;
  
  constructor(llmManager?: LLMManager) {
    // Use provided LLM manager or create default
    this.llmManager = llmManager || createLLMManager({
      provider: (process.env.LLM_PROVIDER as any) || 'groq',
      apiKey: process.env.GROQ_API_KEY || 'demo-key',
      model: process.env.LLM_MODEL || 'llama-3.1-8b-instant',
      fallbackProvider: process.env.LLM_FALLBACK_PROVIDER as any,
      fallbackApiKey: process.env.LLM_FALLBACK_API_KEY,
      costLimit: process.env.LLM_COST_LIMIT ? parseFloat(process.env.LLM_COST_LIMIT) : 0.01
    });
  }

  async initialize() {
    if (!this.browser) {
      console.log('🚀 Initializing browser...');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-bots',
          '--disable-web-security'
        ]
      });
    }
  }

  async postToBoard(board: JobBoard, jobData: JobData): Promise<LLMPostingResult> {
    await this.initialize();
    let page: Page | null = null;
    const startTime = Date.now();

    try {
      console.log(`\n🎯 Starting LLM-powered posting to ${board.name}`);
      console.log(`📍 URL: ${board.postUrl}`);
      
      page = await this.browser!.newPage();
      
      // Set realistic browser context
      await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Navigate to job board
      console.log(`🌐 Navigating to ${board.name}...`);
      await page.goto(board.postUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Get page content for LLM analysis
      console.log(`📄 Getting page content...`);
      const htmlContent = await page.content();
      const currentUrl = page.url();
      
      // Use LLM to analyze the form
      console.log(`🤖 Analyzing form with ${this.llmManager.getProviderInfo().provider} LLM...`);
      const formAnalysis = await this.llmManager.analyzeJobForm(
        htmlContent, 
        currentUrl, 
        board.name
      );
      
      if (!formAnalysis.success || formAnalysis.fields.length === 0) {
        return {
          success: false,
          error: 'LLM could not find job posting form',
          formAnalysis,
          llmProvider: this.llmManager.getProviderInfo().provider,
          responseTime: Date.now() - startTime
        };
      }

      console.log(`✅ LLM found ${formAnalysis.fields.length} form fields (confidence: ${formAnalysis.confidence})`);
      
      // Fill form using LLM-detected selectors
      const fillResult = await this.fillFormWithLLMSelectors(page, formAnalysis.fields, jobData);
      
      if (!fillResult.success) {
        return {
          success: false,
          error: fillResult.error,
          formAnalysis,
          llmProvider: this.llmManager.getProviderInfo().provider,
          responseTime: Date.now() - startTime
        };
      }

      // Submit the form
      console.log(`🚀 Submitting form to ${board.name}...`);
      const submitResult = await this.submitForm(page, formAnalysis.fields);
      
      // Get final URL and take screenshot
      const finalUrl = page.url();
      await page.screenshot({ fullPage: true });
      
      return {
        success: submitResult.success,
        externalUrl: finalUrl !== currentUrl ? finalUrl : undefined,
        error: submitResult.error,
        formAnalysis,
        llmCost: formAnalysis.cost,
        llmProvider: this.llmManager.getProviderInfo().provider,
        responseTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`💥 Error posting to ${board.name}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        llmProvider: this.llmManager.getProviderInfo().provider,
        responseTime: Date.now() - startTime
      };
      
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async fillFormWithLLMSelectors(page: Page, fields: FormField[], jobData: JobData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 Filling form using LLM-detected selectors...`);
      
      for (const field of fields) {
        if (field.confidence < 0.5) {
          console.log(`⚠️  Skipping low-confidence field: ${field.type} (${field.confidence})`);
          continue;
        }
        
        try {
          let value = '';
          
          switch (field.type) {
            case 'title':
              value = jobData.title;
              break;
            case 'description':
              value = jobData.description;
              break;
            case 'location':
              value = jobData.location;
              break;
            case 'company':
              value = jobData.company;
              break;
            case 'email':
              value = jobData.contactEmail;
              break;
            case 'salary':
              if (jobData.salaryMin && jobData.salaryMax) {
                value = `$${jobData.salaryMin.toLocaleString()} - $${jobData.salaryMax.toLocaleString()}`;
              } else if (jobData.salaryMin) {
                value = `$${jobData.salaryMin.toLocaleString()}+`;
              }
              break;
          }
          
          if (value && field.type !== 'submit') {
            await page.fill(field.selector, value);
            console.log(`✅ Filled ${field.type}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
            
            // Small delay between fields for more human-like behavior
            await page.waitForTimeout(300 + Math.random() * 500);
          }
          
        } catch (fieldError) {
          console.log(`⚠️  Failed to fill ${field.type} with selector "${field.selector}": ${fieldError}`);
        }
      }
      
      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Form filling failed' 
      };
    }
  }

  private async submitForm(page: Page, fields: FormField[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Find submit button from LLM analysis
      const submitField = fields.find(f => f.type === 'submit');
      
      if (!submitField) {
        return { success: false, error: 'No submit button found by LLM' };
      }
      
      // Wait a moment before submitting (human-like behavior)
      await page.waitForTimeout(1000 + Math.random() * 2000);
      
      // Click submit
      await page.click(submitField.selector);
      console.log(`✅ Clicked submit button: ${submitField.selector}`);
      
      // Wait for navigation or success indication
      try {
        await Promise.race([
          page.waitForNavigation({ timeout: 15000 }),
          page.waitForSelector('.success', { timeout: 10000 }),
          page.waitForSelector('[class*="success"]', { timeout: 10000 }),
          page.waitForTimeout(8000) // Fallback timeout
        ]);
      } catch (waitError) {
        console.log(`⚠️  No clear success indication, proceeding anyway`);
      }
      
      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Form submission failed' 
      };
    }
  }

  // Method to switch LLM provider at runtime
  async switchLLMProvider(provider: 'groq' | 'openai' | 'anthropic', apiKey: string, model?: string) {
    try {
      await this.llmManager.switchProvider(provider, apiKey, model);
      console.log(`🔄 LLM provider switched to ${provider}${model ? ` (${model})` : ''}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to switch LLM provider:`, error);
      return false;
    }
  }

  // Get current LLM info
  getLLMInfo() {
    return {
      ...this.llmManager.getProviderInfo(),
      usage: this.llmManager.getUsageStats()
    };
  }

  // Test LLM connection
  async testLLMConnection() {
    return await this.llmManager.testConnection();
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Static method to create with specific provider
  static createWithGroq(apiKey: string, model?: string): LLMPoweredJobPoster {
    const llmManager = createLLMManager({
      provider: 'groq',
      apiKey,
      model: model || 'llama-3.1-8b-instant'
    });
    
    return new LLMPoweredJobPoster(llmManager);
  }

  static createWithOpenAI(apiKey: string, model?: string): LLMPoweredJobPoster {
    const llmManager = createLLMManager({
      provider: 'openai',
      apiKey,
      model: model || 'gpt-4o-mini'
    });
    
    return new LLMPoweredJobPoster(llmManager);
  }

  static createWithAnthropic(apiKey: string, model?: string): LLMPoweredJobPoster {
    const llmManager = createLLMManager({
      provider: 'anthropic',
      apiKey,
      model: model || 'claude-3-5-haiku-20241022'
    });
    
    return new LLMPoweredJobPoster(llmManager);
  }
}