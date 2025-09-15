import { LLMProvider, LLMConfig, LLMProviderRegistry, LLMUsageTracker } from './types';
import { GroqProvider } from './providers/groq';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

// Register all available providers
LLMProviderRegistry.register('groq', GroqProvider);
LLMProviderRegistry.register('openai', OpenAIProvider);
LLMProviderRegistry.register('anthropic', AnthropicProvider);

export interface LLMManagerConfig {
  provider: 'groq' | 'openai' | 'anthropic';
  model?: string;
  apiKey: string;
  fallbackProvider?: 'groq' | 'openai' | 'anthropic';
  fallbackApiKey?: string;
  costLimit?: number; // Max cost per operation in USD
}

export class LLMManager {
  private primaryProvider: LLMProvider;
  private fallbackProvider?: LLMProvider;
  private config: LLMManagerConfig;

  constructor(config: LLMManagerConfig) {
    this.config = config;

    // Create primary provider
    this.primaryProvider = this.createProvider(
      config.provider,
      config.apiKey,
      config.model
    );

    // Create fallback provider if specified
    if (config.fallbackProvider && config.fallbackApiKey) {
      this.fallbackProvider = this.createProvider(
        config.fallbackProvider,
        config.fallbackApiKey
      );
    }
  }

  private createProvider(providerName: string, apiKey: string, model?: string): LLMProvider {
    const llmConfig: LLMConfig = {
      apiKey,
      model: model || this.getDefaultModel(providerName),
      temperature: 0.1,
      maxTokens: 2048,
      timeout: 30000
    };

    return LLMProviderRegistry.create(providerName, llmConfig);
  }

  private getDefaultModel(provider: string): string {
    const defaults = {
      groq: 'llama-3.1-8b-instant',      // Fastest & cheapest
      openai: 'gpt-4o-mini',             // Best balance
      anthropic: 'claude-3-5-haiku-20241022' // Fastest Claude
    };
    
    return defaults[provider as keyof typeof defaults] || 'llama-3.1-8b-instant';
  }

  // Main method for form analysis with fallback support
  async analyzeJobForm(htmlContent: string, url: string, boardName: string, retryWithFallback: boolean = true): Promise<any> {
    try {
      console.log(`🤖 Analyzing form with ${this.config.provider}...`);
      
      const result = await this.primaryProvider.analyzeJobForm(htmlContent, url, boardName);
      
      // Check cost limit
      if (this.config.costLimit && result.cost && result.cost > this.config.costLimit) {
        console.warn(`💰 Cost limit exceeded: $${result.cost} > $${this.config.costLimit}`);
      }

      return result;
      
    } catch (error) {
      console.error(`❌ Primary provider (${this.config.provider}) failed:`, error);
      
      // Try fallback provider
      if (retryWithFallback && this.fallbackProvider) {
        try {
          console.log(`🔄 Trying fallback provider (${this.config.fallbackProvider})...`);
          return await this.fallbackProvider.analyzeJobForm(htmlContent, url, boardName);
        } catch (fallbackError) {
          console.error(`❌ Fallback provider also failed:`, fallbackError);
          throw new Error(`Both primary (${this.config.provider}) and fallback (${this.config.fallbackProvider}) providers failed`);
        }
      }
      
      throw error;
    }
  }

  // Switch provider at runtime
  async switchProvider(newProvider: 'groq' | 'openai' | 'anthropic', apiKey: string, model?: string) {
    try {
      console.log(`🔄 Switching from ${this.config.provider} to ${newProvider}...`);
      
      this.primaryProvider = this.createProvider(newProvider, apiKey, model);
      
      // Validate new provider
      const isValid = await this.primaryProvider.validateApiKey?.();
      if (isValid === false) {
        throw new Error('New provider API key validation failed');
      }
      
      this.config.provider = newProvider;
      this.config.apiKey = apiKey;
      if (model) this.config.model = model;
      
      console.log(`✅ Successfully switched to ${newProvider}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to switch to ${newProvider}:`, error);
      throw error;
    }
  }

  // Get current provider info
  getProviderInfo() {
    return {
      provider: this.config.provider,
      model: this.config.model,
      hasFailover: !!this.fallbackProvider,
      fallbackProvider: this.config.fallbackProvider
    };
  }

  // Get cost estimation for operation
  estimateCost(inputTokens: number, outputTokens: number = 500): number {
    const provider = this.config.provider;
    const model = this.config.model || this.getDefaultModel(provider);
    
    let pricing;
    
    switch (provider) {
      case 'groq':
        pricing = GroqProvider.getPricing(model);
        break;
      case 'openai':
        pricing = OpenAIProvider.getPricing(model);
        break;
      case 'anthropic':
        pricing = AnthropicProvider.getPricing(model);
        break;
      default:
        return 0;
    }
    
    if (!pricing) return 0;
    
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    
    return inputCost + outputCost;
  }

  // Test provider connection
  async testConnection(): Promise<{ success: boolean; provider: string; responseTime: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.primaryProvider.analyze([
        { role: 'user', content: 'Say "test successful"' }
      ]);
      
      return {
        success: true,
        provider: this.config.provider,
        responseTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        provider: this.config.provider,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get usage statistics
  getUsageStats() {
    return {
      totalCost: this.getTotalCost(),
      costByProvider: this.getCostByProvider(),
      recentUsage: this.getRecentUsage()
    };
  }

  private getTotalCost(): number {
    return LLMUsageTracker.getTotalCost();
  }

  private getCostByProvider(): Record<string, number> {
    return LLMUsageTracker.getUsageByProvider();
  }

  private getRecentUsage() {
    return LLMUsageTracker.getRecentUsage(24);
  }
}

// Factory function for easy initialization
export function createLLMManager(config: LLMManagerConfig): LLMManager {
  return new LLMManager(config);
}

// Configuration helper
export function getLLMConfigFromEnv(): LLMManagerConfig {
  const provider = (process.env.LLM_PROVIDER || 'groq') as 'groq' | 'openai' | 'anthropic';
  const model = process.env.LLM_MODEL;
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
  
  if (!apiKey) {
    throw new Error(`No API key found for provider: ${provider}. Set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY`);
  }

  return {
    provider,
    model,
    apiKey,
    fallbackProvider: process.env.LLM_FALLBACK_PROVIDER as any,
    fallbackApiKey: process.env.LLM_FALLBACK_API_KEY,
    costLimit: process.env.LLM_COST_LIMIT ? parseFloat(process.env.LLM_COST_LIMIT) : undefined
  };
}

// Export convenient defaults
export const defaultLLMManager = createLLMManager({
  provider: 'groq',
  apiKey: process.env.GROQ_API_KEY || 'demo-key',
  model: 'llama-3.1-8b-instant',
  fallbackProvider: 'openai',
  fallbackApiKey: process.env.OPENAI_API_KEY,
  costLimit: 0.01 // Max 1 cent per operation
});