import { OpenAI } from 'openai';
import { LLMProvider, LLMMessage, LLMResponse, LLMConfig, LLMUsageTracker } from '../types';

export class OpenAIProvider extends LLMProvider {
  private client: OpenAI;
  
  // OpenAI pricing per million tokens (as of 2025)
  private static readonly PRICING = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'gpt-4': { input: 30.00, output: 60.00 }
  };

  constructor(config: LLMConfig) {
    super(config);
    
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey
    });

    // Set default model if not provided
    if (!config.model) {
      config.model = 'gpt-4o-mini'; // Good balance of cost and performance
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
        temperature: this.config.temperature || 0.1,
        max_tokens: this.config.maxTokens || 2048
      });

      const responseTime = Date.now() - startTime;
      const usage = response.usage;
      const content = response.choices[0]?.message?.content || '';
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Calculate cost
      const pricing = OpenAIProvider.PRICING[this.config.model as keyof typeof OpenAIProvider.PRICING];
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
        provider: 'openai',
        model: this.config.model,
        responseTime
      };

      // Track usage
      if (usage && cost > 0) {
        LLMUsageTracker.track({
          provider: 'openai',
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
      console.error('OpenAI API error:', error);
      
      if (error instanceof Error) {
        throw new Error(`OpenAI API failed: ${error.message}`);
      } else {
        throw new Error('Unknown OpenAI API error');
      }
    }
  }

  static getAvailableModels(): string[] {
    return Object.keys(this.PRICING);
  }

  static getPricing(model: string): { input: number; output: number } | null {
    return this.PRICING[model as keyof typeof this.PRICING] || null;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const testResponse = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      
      return !!testResponse.choices[0];
    } catch (error) {
      console.error('OpenAI API key validation failed:', error);
      return false;
    }
  }
}