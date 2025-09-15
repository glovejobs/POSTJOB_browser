import Groq from 'groq-sdk';
import { LLMProvider, LLMMessage, LLMResponse, LLMConfig, LLMUsageTracker } from '../types';

export class GroqProvider extends LLMProvider {
  private client: Groq;
  
  // Groq pricing per million tokens (as of 2025)
  private static readonly PRICING = {
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
    'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
    'llama-3.1-8b-instant': { input: 0.05, output: 0.10 },
    'llama-4-scout': { input: 0.11, output: 0.34 },
    'llama-4-maverick': { input: 0.50, output: 0.77 },
    'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
    'gemma-7b-it': { input: 0.07, output: 0.07 }
  };

  constructor(config: LLMConfig) {
    super(config);
    
    if (!config.apiKey) {
      throw new Error('Groq API key is required');
    }

    this.client = new Groq({
      apiKey: config.apiKey
    });

    // Set default model if not provided
    if (!config.model) {
      config.model = 'llama-3.1-8b-instant'; // Fast and cheap for form analysis
    }
  }

  async analyze(messages: LLMMessage[]): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: this.config.temperature || 0.1, // Low temperature for consistent output
        max_tokens: this.config.maxTokens || 2048,
        stream: false
      });

      const responseTime = Date.now() - startTime;
      const usage = response.usage;
      const content = response.choices[0]?.message?.content || '';
      
      if (!content) {
        throw new Error('Empty response from Groq');
      }

      // Calculate cost
      const pricing = GroqProvider.PRICING[this.config.model as keyof typeof GroqProvider.PRICING];
      let cost = 0;
      
      if (pricing && usage) {
        const inputCost = (usage.prompt_tokens / 1_000_000) * pricing.input;
        const outputCost = (usage.completion_tokens / 1_000_000) * pricing.output;
        cost = inputCost + outputCost;
      }

      const llmResponse: LLMResponse = {
        content,
        usage: usage ? {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        } : undefined,
        cost,
        provider: 'groq',
        model: this.config.model,
        responseTime
      };

      // Track usage
      if (usage && cost > 0) {
        LLMUsageTracker.track({
          provider: 'groq',
          model: this.config.model,
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          cost,
          timestamp: new Date(),
          operation: 'form_analysis'
        });
      }

      return llmResponse;

    } catch (error) {
      console.error('Groq API error:', error);
      
      if (error instanceof Error) {
        throw new Error(`Groq API failed: ${error.message}`);
      } else {
        throw new Error('Unknown Groq API error');
      }
    }
  }

  // Static method to get available models
  static getAvailableModels(): string[] {
    return Object.keys(this.PRICING);
  }

  // Static method to get pricing for a model
  static getPricing(model: string): { input: number; output: number } | null {
    return this.PRICING[model as keyof typeof this.PRICING] || null;
  }

  // Validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      const testResponse = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      
      return !!testResponse.choices[0];
    } catch (error) {
      console.error('Groq API key validation failed:', error);
      return false;
    }
  }

  // Get account usage/limits (if available)
  async getAccountInfo(): Promise<any> {
    try {
      // Groq doesn't have a direct account info endpoint
      // This is a placeholder for future implementation
      return {
        provider: 'groq',
        model: this.config.model,
        status: 'active'
      };
    } catch (error) {
      console.error('Failed to get Groq account info:', error);
      return null;
    }
  }
}