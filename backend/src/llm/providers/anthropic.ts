import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMMessage, LLMResponse, LLMConfig, LLMUsageTracker } from '../types';

export class AnthropicProvider extends LLMProvider {
  private client: Anthropic;
  
  // Anthropic pricing per million tokens (as of 2025)
  private static readonly PRICING = {
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
  };

  constructor(config: LLMConfig) {
    super(config);
    
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey
    });

    // Set default model if not provided
    if (!config.model) {
      config.model = 'claude-3-5-haiku-20241022'; // Cheapest and fastest
    }
  }

  async analyze(messages: LLMMessage[]): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      // Convert messages format for Anthropic
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role !== 'system');

      const response = await this.client.messages.create({
        model: this.config.model,
        system: systemMessage,
        messages: userMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        temperature: this.config.temperature || 0.1,
        max_tokens: this.config.maxTokens || 2048
      });

      const responseTime = Date.now() - startTime;
      const usage = response.usage;
      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      if (!content) {
        throw new Error('Empty response from Anthropic');
      }

      // Calculate cost
      const pricing = AnthropicProvider.PRICING[this.config.model as keyof typeof AnthropicProvider.PRICING];
      let cost = 0;
      
      if (pricing && usage) {
        const inputCost = (usage.input_tokens / 1_000_000) * pricing.input;
        const outputCost = (usage.output_tokens / 1_000_000) * pricing.output;
        cost = inputCost + outputCost;
      }

      const llmResponse: LLMResponse = {
        content,
        usage: usage ? {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens
        } : undefined,
        cost,
        provider: 'anthropic',
        model: this.config.model,
        responseTime
      };

      // Track usage
      if (usage && cost > 0) {
        LLMUsageTracker.track({
          provider: 'anthropic',
          model: this.config.model,
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          cost,
          timestamp: new Date(),
          operation: 'form_analysis'
        });
      }

      return llmResponse;

    } catch (error) {
      console.error('Anthropic API error:', error);
      
      if (error instanceof Error) {
        throw new Error(`Anthropic API failed: ${error.message}`);
      } else {
        throw new Error('Unknown Anthropic API error');
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
      const testResponse = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      
      return !!testResponse.content[0];
    } catch (error) {
      console.error('Anthropic API key validation failed:', error);
      return false;
    }
  }
}