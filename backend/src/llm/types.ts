// LLM Provider Types and Interfaces

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: number; // in USD
  provider: string;
  model: string;
  responseTime: number; // in milliseconds
}

export interface LLMConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface FormField {
  selector: string;
  type: 'title' | 'description' | 'location' | 'company' | 'email' | 'salary' | 'submit' | 'other';
  label?: string;
  required?: boolean;
  placeholder?: string;
  confidence: number; // 0-1 score of how confident the LLM is
}

export interface FormAnalysisResponse {
  success: boolean;
  fields: FormField[];
  formUrl: string;
  boardName: string;
  confidence: number;
  warnings?: string[];
  errors?: string[];
  cost?: number;
}

export interface JobData {
  id?: string;
  title: string;
  description: string;
  location: string;
  company: string;
  contactEmail: string;
  salaryMin?: number;
  salaryMax?: number;
}

// Main LLM Provider Interface
export abstract class LLMProvider {
  protected config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }

  // Core method that all providers must implement
  abstract analyze(messages: LLMMessage[]): Promise<LLMResponse>;

  // Optional method for API key validation
  validateApiKey?(): Promise<boolean>;

  // Convenience method for form analysis
  async analyzeJobForm(htmlContent: string, url: string, boardName: string): Promise<FormAnalysisResponse> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are an expert at analyzing job posting forms on websites. Your job is to identify form fields that correspond to job posting data.

TASK: Analyze the HTML content and identify CSS selectors for job posting form fields.

REQUIRED OUTPUT: Return a JSON object with this exact structure:
{
  "success": true,
  "fields": [
    {
      "selector": "CSS_SELECTOR_HERE",
      "type": "title|description|location|company|email|salary|submit",
      "label": "Field label text",
      "required": true|false,
      "placeholder": "placeholder text if any",
      "confidence": 0.0-1.0
    }
  ],
  "formUrl": "${url}",
  "boardName": "${boardName}",
  "confidence": 0.0-1.0,
  "warnings": ["any warnings about the form"],
  "errors": []
}

FIELD TYPES TO FIND:
- title: Job title input field
- description: Job description textarea
- location: Job location input
- company: Company name input
- email: Contact email input
- salary: Salary/compensation input
- submit: Submit/Post button

SELECTOR PRIORITIES:
1. Look for inputs/textareas with name attributes containing relevant keywords
2. Look for ID attributes with relevant keywords
3. Look for placeholder text that matches job fields
4. Look for nearby labels that indicate field purpose
5. Use class names as last resort

Be conservative with confidence scores. Only return confidence > 0.8 for very obvious matches.
Return empty arrays if no form is found, but still return valid JSON structure.`
      },
      {
        role: 'user',
        content: `Analyze this job posting form HTML and identify the selectors:

URL: ${url}
Board: ${boardName}

HTML Content:
${htmlContent.substring(0, 8000)}` // Limit HTML to prevent token overflow
      }
    ];

    try {
      const response = await this.analyze(messages);
      
      // Parse JSON response
      const parsed = JSON.parse(response.content);
      
      // Validate response structure
      if (!parsed.success !== undefined || !Array.isArray(parsed.fields)) {
        throw new Error('Invalid response structure from LLM');
      }

      return parsed;
      
    } catch (error) {
      console.error('LLM form analysis failed:', error);
      return {
        success: false,
        fields: [],
        formUrl: url,
        boardName: boardName,
        confidence: 0,
        errors: [`LLM analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // Convenience method for job optimization
  async optimizeJobDescription(jobData: JobData, boardName: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are an expert at optimizing job descriptions for different job boards to maximize applications.

Your task is to optimize the job description while keeping all essential information, but tailoring it for the specific job board's audience and format preferences.

Keep the description professional, engaging, and optimized for the target platform.
Return only the optimized job description text, nothing else.`
      },
      {
        role: 'user',
        content: `Optimize this job description for ${boardName}:

Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location}
${jobData.salaryMin && jobData.salaryMax ? `Salary: $${jobData.salaryMin} - $${jobData.salaryMax}` : ''}

Current Description:
${jobData.description}

Return the optimized description:`
      }
    ];

    try {
      const response = await this.analyze(messages);
      return response.content.trim();
    } catch (error) {
      console.error('Job description optimization failed:', error);
      return jobData.description; // Return original if optimization fails
    }
  }
}

// Provider Registry for easy switching
export class LLMProviderRegistry {
  private static providers = new Map<string, typeof LLMProvider>();
  private static defaultProvider: string = 'groq';

  static register(name: string, provider: typeof LLMProvider) {
    this.providers.set(name, provider);
  }

  static create(name: string, config: LLMConfig): LLMProvider {
    const Provider = this.providers.get(name);
    if (!Provider) {
      throw new Error(`LLM provider '${name}' not registered`);
    }
    return new (Provider as any)(config);
  }

  static setDefault(name: string) {
    if (!this.providers.has(name)) {
      throw new Error(`LLM provider '${name}' not registered`);
    }
    this.defaultProvider = name;
  }

  static getDefault(): string {
    return this.defaultProvider;
  }

  static listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Cost tracking
export interface CostTracker {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
  operation: string;
}

export class LLMUsageTracker {
  private static usage: CostTracker[] = [];

  static track(usage: CostTracker) {
    this.usage.push(usage);
  }

  static getTotalCost(timeframe?: { start: Date; end: Date }): number {
    let filtered = this.usage;
    
    if (timeframe) {
      filtered = this.usage.filter(u => 
        u.timestamp >= timeframe.start && u.timestamp <= timeframe.end
      );
    }
    
    return filtered.reduce((total, u) => total + u.cost, 0);
  }

  static getUsageByProvider(): Record<string, number> {
    return this.usage.reduce((acc, u) => {
      acc[u.provider] = (acc[u.provider] || 0) + u.cost;
      return acc;
    }, {} as Record<string, number>);
  }

  static getRecentUsage(hours: number = 24): CostTracker[] {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.usage.filter(u => u.timestamp >= since);
  }
}