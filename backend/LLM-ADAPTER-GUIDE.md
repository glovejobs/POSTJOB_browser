# 🤖 LLM Adapter System for Job Multi-Post

## 🎯 **Overview**

Flexible LLM adapter system that allows you to easily switch between different AI providers (Groq, OpenAI, Anthropic) for intelligent job form analysis and filling. Designed for cost optimization and reliability.

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
npm install groq-sdk openai @anthropic-ai/sdk
```

### **2. Configure Environment**
```env
# Primary LLM Provider
LLM_PROVIDER=groq                    # groq | openai | anthropic
LLM_MODEL=llama-3.1-8b-instant      # Model name
GROQ_API_KEY=gsk_your_key_here      
OPENAI_API_KEY=sk-your_key_here     
ANTHROPIC_API_KEY=sk-ant_your_key   

# Optional: Fallback Provider
LLM_FALLBACK_PROVIDER=openai        
LLM_FALLBACK_API_KEY=sk-fallback    
LLM_COST_LIMIT=0.01                 # Max $0.01 per operation
```

### **3. Basic Usage**
```javascript
import { createLLMManager } from './src/llm/llm-manager';
import { LLMPoweredJobPoster } from './src/automation/llm-powered-job-poster';

// Create LLM manager
const llmManager = createLLMManager({
  provider: 'groq',
  apiKey: 'your-groq-key',
  model: 'llama-3.1-8b-instant'
});

// Create job poster with LLM
const poster = new LLMPoweredJobPoster(llmManager);

// Post to job board (LLM automatically detects form fields)
const result = await poster.postToBoard(jobBoard, jobData);
```

## 📊 **Provider Comparison**

| Provider | Model | Cost/Form | Speed | Best For |
|----------|-------|-----------|--------|-----------|
| **Groq** | Llama 3.1 8B | $0.0001 | ⚡ Fastest | **Recommended** |
| **Groq** | Llama 4 Scout | $0.0003 | ⚡ Fast | High accuracy |
| **OpenAI** | GPT-4o Mini | $0.0004 | 🔥 Good | Reliable |
| **Anthropic** | Claude Haiku | $0.0007 | 🔥 Good | Best quality |

### **Monthly Costs (1000 jobs)**
- **Groq (Llama 3.1):** $0.11/month ⭐ **Cheapest**
- **Groq (Llama 4):** $0.27/month
- **OpenAI (Mini):** $0.41/month  
- **Anthropic (Haiku):** $0.75/month

## 🔄 **Runtime Provider Switching**

### **Via API (Recommended)**
```bash
# Switch to Groq
curl -X POST http://localhost:3001/api/admin/llm/switch \
  -H "x-admin-key: admin-demo-key" \
  -H "Content-Type: application/json" \
  -d '{"provider":"groq","model":"llama-4-scout"}'

# Switch to OpenAI  
curl -X POST http://localhost:3001/api/admin/llm/switch \
  -H "x-admin-key: admin-demo-key" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","model":"gpt-4o-mini"}'

# Switch to Anthropic
curl -X POST http://localhost:3001/api/admin/llm/switch \
  -H "x-admin-key: admin-demo-key" \
  -H "Content-Type: application/json" \
  -d '{"provider":"anthropic","model":"claude-3-5-haiku-20241022"}'
```

### **Via Code**
```javascript
// Switch provider programmatically
await llmManager.switchProvider('groq', 'your-groq-key', 'llama-4-scout');

// Or use factory methods
const groqPoster = LLMPoweredJobPoster.createWithGroq('your-key');
const openaiPoster = LLMPoweredJobPoster.createWithOpenAI('your-key');
const anthropicPoster = LLMPoweredJobPoster.createWithAnthropic('your-key');
```

## 🔍 **Form Analysis Process**

### **1. LLM Analyzes HTML**
```javascript
const analysis = await llmManager.analyzeJobForm(htmlContent, url, boardName);

// Returns:
{
  "success": true,
  "fields": [
    {
      "selector": "#job-title",
      "type": "title", 
      "confidence": 0.95,
      "required": true
    },
    {
      "selector": "textarea[name='description']",
      "type": "description",
      "confidence": 0.88,
      "required": true  
    }
  ],
  "confidence": 0.89
}
```

### **2. Automatic Form Filling**
- LLM-detected selectors used to fill form fields
- Confidence-based filtering (skip low-confidence fields)
- Human-like delays between field filling
- Automatic form submission

## 📈 **Monitoring & Analytics**

### **Cost Tracking**
```bash
# Get current LLM status
curl -H "x-admin-key: admin-demo-key" http://localhost:3001/api/admin/llm/status

# View usage statistics  
curl -H "x-admin-key: admin-demo-key" http://localhost:3001/api/admin/llm/usage
```

### **Performance Monitoring**
- Response time tracking per operation
- Success rate monitoring per provider
- Cost tracking with usage limits
- Automatic fallback on provider failure

## 🛡️ **Error Handling & Fallbacks**

### **Multi-Provider Reliability**
```javascript
const llmManager = createLLMManager({
  provider: 'groq',                    // Primary (cheapest)
  apiKey: 'groq-key',
  fallbackProvider: 'openai',         // Fallback (reliable)  
  fallbackApiKey: 'openai-key',
  costLimit: 0.01                     // Safety limit
});

// Auto-switches to fallback if primary fails
const analysis = await llmManager.analyzeJobForm(html, url, board);
```

### **Cost Protection**
- Maximum cost per operation limits
- Daily/monthly spending caps
- Automatic provider switching based on cost
- Real-time usage monitoring

## 🔧 **Admin Dashboard Endpoints**

| Endpoint | Method | Purpose |
|----------|---------|---------|
| `/api/admin/llm/status` | GET | Current provider & costs |
| `/api/admin/llm/switch` | POST | Change LLM provider |
| `/api/admin/llm/usage` | GET | Usage statistics |
| `/api/admin/llm/cost-estimate` | GET | Estimate operation cost |

**Admin Authentication:** Add header `x-admin-key: admin-demo-key`

## 🎯 **Production Setup**

### **1. Environment Variables**
```env
# Production config
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant
GROQ_API_KEY=gsk_live_key_here

# Cost controls  
LLM_COST_LIMIT=0.005                # $0.005 per operation max
LLM_DAILY_LIMIT=10.00               # $10/day max
LLM_MONTHLY_LIMIT=100.00            # $100/month max
```

### **2. Monitoring Setup**
```javascript
// Production monitoring
setInterval(() => {
  const dailyCost = LLMUsageTracker.getTotalCost({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date()
  });
  
  if (dailyCost > parseFloat(process.env.LLM_DAILY_LIMIT)) {
    console.warn(`🚨 Daily LLM cost limit exceeded: $${dailyCost}`);
    // Switch to cheaper provider or disable LLM temporarily
  }
}, 60000); // Check every minute
```

## 🚀 **Advanced Features**

### **Provider Selection Strategy**
```javascript
// Smart provider selection based on requirements
function selectOptimalProvider(complexity, budget) {
  if (budget === 'minimal') return 'groq/llama-3.1-8b';
  if (complexity === 'high') return 'anthropic/claude-3-5-haiku'; 
  if (speed === 'critical') return 'groq/llama-4-scout';
  
  return 'groq/llama-3.1-8b'; // Default to cheapest
}
```

### **Caching for Cost Optimization**
```javascript
// Cache form analysis results to avoid repeated LLM calls
const formCache = new Map();

async function getCachedFormAnalysis(url, htmlHash) {
  const cacheKey = `${url}:${htmlHash}`;
  
  if (formCache.has(cacheKey)) {
    return formCache.get(cacheKey); // Save money!
  }
  
  const analysis = await llmManager.analyzeJobForm(html, url, board);
  formCache.set(cacheKey, analysis);
  
  return analysis;
}
```

## 💰 **Cost Optimization Tips**

1. **Start with Groq** (cheapest + fastest)
2. **Use caching** for repeated form analysis
3. **Set cost limits** to prevent overruns
4. **Monitor usage** daily in production
5. **Fallback providers** for reliability
6. **Smaller models** for simple tasks

## 🧪 **Testing**

```bash
# Test the complete system
node test-llm-integration.js

# Test individual providers
curl -H "x-admin-key: admin-demo-key" http://localhost:3001/api/admin/llm/status
```

## 🎉 **Benefits**

- **🔄 Easy Provider Switching** - Change LLM anytime via API
- **💰 Cost Optimization** - Start with cheapest, upgrade as needed  
- **🛡️ Reliability** - Automatic fallback on failures
- **📊 Monitoring** - Real-time cost and usage tracking
- **⚡ Performance** - Groq provides fastest inference
- **🔒 Safety** - Built-in cost limits and safeguards

---

**Ready to use!** The system is designed for production with proper error handling, cost controls, and easy maintenance.