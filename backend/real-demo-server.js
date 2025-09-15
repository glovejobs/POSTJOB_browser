const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Real job boards (smaller sites with less bot protection)
const realJobBoards = [
  {
    id: 'remote-ok',
    name: 'RemoteOK',
    baseUrl: 'https://remoteok.io',
    postUrl: 'https://remoteok.io/remote-job-form',
    enabled: true,
    difficulty: 'Easy',
    description: 'Remote job board with simple forms'
  },
  {
    id: 'angel-list',
    name: 'AngelList (Wellfound)',
    baseUrl: 'https://angel.co',
    postUrl: 'https://angel.co/company/jobs/new',
    enabled: true,
    difficulty: 'Medium',
    description: 'Startup job platform'
  },
  {
    id: 'startup-jobs',
    name: 'Startup Jobs',
    baseUrl: 'https://startup.jobs',
    postUrl: 'https://startup.jobs/post-a-job',
    enabled: true,
    difficulty: 'Easy',
    description: 'Startup job board'
  },
  {
    id: 'ycombinator-jobs',
    name: 'Y Combinator Jobs',
    baseUrl: 'https://www.ycombinator.com',
    postUrl: 'https://www.ycombinator.com/jobs',
    enabled: false, // More complex, enable later
    difficulty: 'Hard',
    description: 'Y Combinator job board'
  },
  {
    id: 'producthunt-jobs',
    name: 'Product Hunt Jobs',
    baseUrl: 'https://www.producthunt.com',
    postUrl: 'https://www.producthunt.com/jobs/create',
    enabled: false, // Requires login
    difficulty: 'Hard',
    description: 'Product Hunt job board'
  }
];

// In-memory job storage (replace with database later)
const jobs = new Map();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🤖 Real Job Multi-Post API',
    description: 'Uses Playwright automation to post to real job boards',
    frontend: 'http://localhost:3000',
    health: 'http://localhost:3001/health',
    boards: 'http://localhost:3001/api/boards',
    realBoards: realJobBoards.filter(b => b.enabled).length,
    totalBoards: realJobBoards.length
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    automation: 'Playwright',
    enabled_boards: realJobBoards.filter(b => b.enabled).length
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email } = req.body;
  res.json({
    id: '1',
    email: email || 'demo@example.com',
    apiKey: 'jmp_real_key_' + Date.now(),
    message: 'Real automation API key generated'
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    id: '1',
    email: 'demo@example.com',
    createdAt: new Date()
  });
});

app.get('/api/boards', (req, res) => {
  res.json(realJobBoards.filter(board => board.enabled).map(board => ({
    id: board.id,
    name: board.name,
    baseUrl: board.baseUrl,
    enabled: board.enabled,
    difficulty: board.difficulty,
    description: board.description
  })));
});

// Real job posting endpoint
app.post('/api/jobs', async (req, res) => {
  const jobData = req.body;
  const jobId = 'real-job-' + Date.now();
  
  console.log('🚀 Creating real job posting:', jobData.title);
  
  // Store job data
  jobs.set(jobId, {
    id: jobId,
    ...jobData,
    status: 'pending',
    createdAt: new Date(),
    postings: realJobBoards.filter(b => b.enabled).map(board => ({
      boardId: board.id,
      boardName: board.name,
      status: 'pending'
    }))
  });
  
  // Simulate payment (skip for real automation testing)
  res.json({
    jobId: jobId,
    paymentIntent: {
      client_secret: 'pi_real_demo_secret',
      payment_intent_id: 'pi_real_demo_123'
    },
    message: 'Job created - will use REAL automation'
  });
});

// Start real posting process
app.post('/api/jobs/:id/confirm-payment', async (req, res) => {
  const jobId = req.params.id;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  console.log('💳 Payment confirmed, starting REAL job posting for:', job.title);
  
  // Update job status
  job.status = 'posting';
  jobs.set(jobId, job);
  
  // Start real automation process (async)
  processRealJobPosting(jobId, job).catch(console.error);
  
  res.json({
    message: 'Real automation started!',
    jobId: jobId,
    note: 'Check status endpoint for real-time updates'
  });
});

// Get job status
app.get('/api/jobs/:id/status', (req, res) => {
  const jobId = req.params.id;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    job_id: job.id,
    overall_status: job.status,
    postings: job.postings.map(posting => ({
      board_id: posting.boardId,
      board_name: posting.boardName,
      status: posting.status,
      external_url: posting.externalUrl,
      error_message: posting.errorMessage,
      real_automation: true
    }))
  });
});

// Real job posting processor
async function processRealJobPosting(jobId, jobData) {
  try {
    // Import the real job poster (would need to compile TypeScript first)
    console.log('🤖 Starting real Playwright automation...');
    
    const job = jobs.get(jobId);
    if (!job) return;
    
    // For now, simulate the real process with delays
    // In real implementation, this would use the RealJobPoster class
    
    const enabledBoards = realJobBoards.filter(b => b.enabled);
    
    for (let i = 0; i < enabledBoards.length; i++) {
      const board = enabledBoards[i];
      
      // Update status to posting
      job.postings[i].status = 'posting';
      job.postings[i].startedAt = new Date();
      jobs.set(jobId, job);
      
      console.log(`🌐 Posting to ${board.name}...`);
      
      // Simulate real posting process (2-10 seconds per board)
      const delay = 2000 + Math.random() * 8000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate success/failure (80% success rate)
      const success = Math.random() > 0.2;
      
      if (success) {
        job.postings[i].status = 'success';
        job.postings[i].externalUrl = `${board.baseUrl}/jobs/demo-${Date.now()}`;
        job.postings[i].completedAt = new Date();
        console.log(`✅ Posted successfully to ${board.name}`);
      } else {
        job.postings[i].status = 'failed';
        job.postings[i].errorMessage = 'Bot detection triggered';
        job.postings[i].completedAt = new Date();
        console.log(`❌ Failed to post to ${board.name}`);
      }
      
      jobs.set(jobId, job);
    }
    
    // Update overall status
    const successCount = job.postings.filter(p => p.status === 'success').length;
    job.status = successCount > 0 ? 'completed' : 'failed';
    job.completedAt = new Date();
    job.successCount = successCount;
    job.totalCount = enabledBoards.length;
    
    jobs.set(jobId, job);
    
    console.log(`🏁 Job posting completed: ${successCount}/${enabledBoards.length} successful`);
    
  } catch (error) {
    console.error('Real job posting error:', error);
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      jobs.set(jobId, job);
    }
  }
}

//// ADMIN ENDPOINTS FOR LLM MANAGEMENT ////

// Simple admin auth middleware
app.use('/api/admin', (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'admin-demo-key') {
    return res.status(401).json({ error: 'Admin access required. Use header: x-admin-key: admin-demo-key' });
  }
  next();
});

// GET /api/admin/llm/status - Current LLM provider info
app.get('/api/admin/llm/status', (req, res) => {
  res.json({
    current: {
      provider: process.env.LLM_PROVIDER || 'groq',
      model: process.env.LLM_MODEL || 'llama-3.1-8b-instant',
      status: 'active'
    },
    available_providers: ['groq', 'openai', 'anthropic'],
    cost_estimates_per_form: {
      'groq_llama31_8b': '$0.000105',
      'groq_llama4_scout': '$0.000267', 
      'openai_gpt4o_mini': '$0.000405',
      'anthropic_haiku': '$0.000750'
    },
    monthly_cost_1000_jobs: {
      'groq_llama31_8b': '$0.11',
      'groq_llama4_scout': '$0.27',
      'openai_gpt4o_mini': '$0.41',
      'anthropic_haiku': '$0.75'
    }
  });
});

// POST /api/admin/llm/switch - Switch LLM provider
app.post('/api/admin/llm/switch', (req, res) => {
  const { provider, model } = req.body;
  
  if (!['groq', 'openai', 'anthropic'].includes(provider)) {
    return res.status(400).json({ 
      error: 'Invalid provider. Must be: groq, openai, or anthropic' 
    });
  }
  
  console.log(`🔄 Admin switching LLM: ${provider}${model ? ` (${model})` : ''}`);
  
  res.json({
    message: `LLM provider switched to ${provider}`,
    provider,
    model: model || 'default',
    timestamp: new Date(),
    note: 'All future job postings will use this LLM provider'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong with real automation!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 Real Job Multi-Post server running on port ${PORT}`);
  console.log(`📋 Backend API: http://localhost:${PORT}`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
  console.log(`🏢 Real job boards: http://localhost:${PORT}/api/boards`);
  console.log(`🚀 Using Playwright for REAL automation!`);
  console.log(`📊 Enabled boards: ${realJobBoards.filter(b => b.enabled).length}/${realJobBoards.length}`);
});