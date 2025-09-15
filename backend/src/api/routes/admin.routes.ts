import { Router } from 'express';
import { LLMManager, createLLMManager } from '../../llm/llm-manager';
import { LLMUsageTracker } from '../../llm/types';

const router = Router();

// Global LLM manager instance (can be switched at runtime)
let globalLLMManager: LLMManager | null = null;

// Initialize LLM manager
function initLLMManager() {
  if (!globalLLMManager) {
    globalLLMManager = createLLMManager({
      provider: (process.env.LLM_PROVIDER as any) || 'groq',
      apiKey: process.env.GROQ_API_KEY || 'demo-key',
      model: process.env.LLM_MODEL || 'llama-3.1-8b-instant',
      fallbackProvider: process.env.LLM_FALLBACK_PROVIDER as any,
      fallbackApiKey: process.env.LLM_FALLBACK_API_KEY,
      costLimit: process.env.LLM_COST_LIMIT ? parseFloat(process.env.LLM_COST_LIMIT) : 0.01
    });
  }
  return globalLLMManager;
}

// GET /api/admin/llm/status - Get current LLM provider info
router.get('/llm/status', async (_req, res) => {
  try {
    const manager = initLLMManager();
    const info = manager.getProviderInfo();
    const usageStats = manager.getUsageStats();
    
    res.json({
      current: info,
      usage: usageStats,
      available_providers: ['groq', 'openai', 'anthropic']
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/admin/llm/switch - Switch LLM provider
router.post('/llm/switch', async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'provider and apiKey are required' });
    }

    if (!['groq', 'openai', 'anthropic'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Must be: groq, openai, or anthropic' });
    }

    const manager = initLLMManager();
    await manager.switchProvider(provider, apiKey, model);

    const newInfo = manager.getProviderInfo();

    return res.json({
      message: `Successfully switched to ${provider}`,
      provider: newInfo,
      timestamp: new Date()
    });

  } catch (error) {
    return res.status(500).json({
      error: `Failed to switch provider: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// POST /api/admin/llm/test - Test current LLM connection
router.post('/llm/test', async (_req, res) => {
  try {
    const manager = initLLMManager();
    const testResult = await manager.testConnection();
    
    res.json(testResult);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Test failed' });
  }
});

// GET /api/admin/llm/cost-estimate - Estimate cost for operation
router.get('/llm/cost-estimate', (req, res) => {
  try {
    const inputTokens = parseInt(req.query.input as string) || 1500;
    const outputTokens = parseInt(req.query.output as string) || 500;
    
    const manager = initLLMManager();
    const estimatedCost = manager.estimateCost(inputTokens, outputTokens);
    
    res.json({
      inputTokens,
      outputTokens,
      estimatedCost,
      provider: manager.getProviderInfo().provider,
      model: manager.getProviderInfo().model
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Cost estimation failed' });
  }
});

// GET /api/admin/llm/usage - Get usage statistics
router.get('/llm/usage', (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    
    const totalCost = LLMUsageTracker.getTotalCost();
    const costByProvider = LLMUsageTracker.getUsageByProvider();
    const recentUsage = LLMUsageTracker.getRecentUsage(hours);
    
    res.json({
      totalCost,
      costByProvider,
      recentUsage: recentUsage.slice(0, 50), // Limit to 50 recent operations
      timeframe: `Last ${hours} hours`,
      operationCount: recentUsage.length
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Usage fetch failed' });
  }
});

// POST /api/admin/llm/analyze-form - Test form analysis on a URL
router.post('/llm/analyze-form', async (req, res) => {
  try {
    const { html, url, boardName } = req.body;

    if (!html || !url || !boardName) {
      return res.status(400).json({ error: 'html, url, and boardName are required' });
    }

    const manager = initLLMManager();
    const analysis = await manager.analyzeJobForm(html, url, boardName);

    return res.json({
      analysis,
      provider: manager.getProviderInfo(),
      timestamp: new Date()
    });

  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Form analysis failed' });
  }
});

// Export the global manager for use in other modules
export function getLLMManager(): LLMManager {
  return initLLMManager();
}

export default router;