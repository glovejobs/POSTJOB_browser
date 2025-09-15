#!/usr/bin/env node

// Simple demo of LLM-powered job form analysis
// This demonstrates the Groq LLM integration without database dependencies

const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk').default;

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Groq client with demo key (you'll need to replace this)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'gsk_demo_key_replace_with_real_key'
});

// Demo job boards with hardcoded selectors for comparison
const DEMO_JOB_BOARDS = [
  {
    id: '1',
    name: 'AngelList',
    postUrl: 'https://angel.co/jobs/post',
    selectors: {
      title: '#job-title',
      description: '#job-description', 
      location: '#location',
      submit: '.submit-btn'
    }
  },
  {
    id: '2', 
    name: 'RemoteOK',
    postUrl: 'https://remoteok.io/jobs/post',
    selectors: {
      title: '[name="job_title"]',
      description: '[name="job_description"]',
      location: '[name="location"]',
      submit: 'button[type="submit"]'
    }
  }
];

// Mock HTML content for demo (would normally be scraped from real sites)
const MOCK_HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <title>Post a Job - Job Board</title>
</head>
<body>
  <div class="job-posting-form">
    <h1>Post Your Job</h1>
    <form id="job-form" action="/jobs/submit" method="POST">
      <div class="form-group">
        <label for="job-title">Job Title *</label>
        <input type="text" id="job-title" name="title" required placeholder="e.g. Senior Software Engineer">
      </div>
      
      <div class="form-group">
        <label for="job-description">Job Description *</label>
        <textarea id="job-description" name="description" required rows="8" placeholder="Describe the role, responsibilities, and requirements..."></textarea>
      </div>
      
      <div class="form-group">
        <label for="location">Location *</label>
        <input type="text" id="location" name="location" required placeholder="e.g. San Francisco, CA or Remote">
      </div>
      
      <div class="form-group">
        <label for="company">Company Name *</label>
        <input type="text" id="company" name="company" required placeholder="Your company name">
      </div>
      
      <div class="form-group">
        <label for="salary">Salary Range (optional)</label>
        <input type="text" id="salary" name="salary" placeholder="e.g. $80,000 - $120,000">
      </div>
      
      <div class="form-group">
        <label for="email">Contact Email *</label>
        <input type="email" id="email" name="email" required placeholder="hiring@company.com">
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" id="submit-job">Post Job</button>
        <button type="button" class="btn btn-secondary">Save Draft</button>
      </div>
    </form>
  </div>
</body>
</html>
`;

// LLM System prompt for form analysis
const FORM_ANALYSIS_PROMPT = `You are an expert web scraper and form analyzer. Your job is to analyze HTML content and identify job posting form fields with high accuracy.

Given an HTML page for posting jobs, identify the CSS selectors for these key fields:
- title (job title)
- description (job description) 
- location (job location)
- company (company name)
- email (contact email)
- salary (salary/compensation - optional)
- submit (submit button)

Respond with ONLY valid JSON in this exact format:
{
  "success": true,
  "confidence": 0.85,
  "fields": [
    {
      "type": "title",
      "selector": "#job-title",
      "confidence": 0.95,
      "context": "Found input field with id 'job-title'"
    },
    {
      "type": "description", 
      "selector": "#job-description",
      "confidence": 0.90,
      "context": "Found textarea with id 'job-description'"
    },
    {
      "type": "submit",
      "selector": "#submit-job", 
      "confidence": 0.95,
      "context": "Found submit button with id 'submit-job'"
    }
  ]
}

Analyze the following HTML and identify the job form fields:`;

// Analyze job form with LLM
async function analyzeJobFormWithLLM(htmlContent, url, boardName) {
  try {
    console.log(`🤖 Analyzing form for ${boardName} with Groq LLM...`);
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: FORM_ANALYSIS_PROMPT
        },
        {
          role: 'user', 
          content: `URL: ${url}\nBoard: ${boardName}\n\nHTML Content:\n${htmlContent}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    // Parse JSON response
    const analysisResult = JSON.parse(content);
    
    // Add cost calculation
    const usage = response.usage;
    let cost = 0;
    if (usage) {
      // Groq pricing for llama-3.1-8b-instant: $0.05/1M input, $0.10/1M output
      const inputCost = (usage.prompt_tokens / 1_000_000) * 0.05;
      const outputCost = (usage.completion_tokens / 1_000_000) * 0.10;
      cost = inputCost + outputCost;
    }

    return {
      ...analysisResult,
      cost,
      usage,
      provider: 'groq',
      model: 'llama-3.1-8b-instant'
    };

  } catch (error) {
    console.error('❌ LLM analysis failed:', error);
    return {
      success: false,
      error: error.message,
      fields: []
    };
  }
}

// API Routes

// Get available job boards
app.get('/api/boards', (req, res) => {
  res.json({
    boards: DEMO_JOB_BOARDS.map(board => ({
      id: board.id,
      name: board.name,
      enabled: true
    }))
  });
});

// Demo LLM form analysis
app.post('/api/analyze-form', async (req, res) => {
  try {
    const { boardName, url } = req.body;
    
    if (!boardName) {
      return res.status(400).json({ error: 'boardName is required' });
    }

    // Use mock HTML for demo (in production, this would scrape the actual URL)
    const htmlContent = MOCK_HTML_CONTENT;
    const analysisUrl = url || 'https://example-job-board.com/post';

    const result = await analyzeJobFormWithLLM(htmlContent, analysisUrl, boardName);
    
    res.json({
      board: boardName,
      url: analysisUrl,
      analysis: result,
      demo_note: "This is using mock HTML content for demonstration"
    });

  } catch (error) {
    console.error('Error in form analysis:', error);
    res.status(500).json({ error: 'Form analysis failed' });
  }
});

// Compare LLM vs hardcoded selectors
app.post('/api/compare-selectors', async (req, res) => {
  try {
    const { boardId } = req.body;
    
    const board = DEMO_JOB_BOARDS.find(b => b.id === boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Get LLM analysis
    const llmResult = await analyzeJobFormWithLLM(MOCK_HTML_CONTENT, board.postUrl, board.name);

    // Compare with hardcoded selectors
    const comparison = {
      board: board.name,
      url: board.postUrl,
      hardcoded_selectors: board.selectors,
      llm_analysis: llmResult,
      comparison: {
        llm_found_fields: llmResult.fields?.length || 0,
        hardcoded_fields: Object.keys(board.selectors).length,
        cost: llmResult.cost,
        success: llmResult.success
      }
    };

    res.json(comparison);

  } catch (error) {
    console.error('Error in selector comparison:', error);
    res.status(500).json({ error: 'Comparison failed' });
  }
});

// Create a demo job posting (simulated)
app.post('/api/jobs/demo', async (req, res) => {
  try {
    const jobData = req.body;
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'location', 'company', 'contactEmail'];
    for (const field of requiredFields) {
      if (!jobData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Simulate analyzing forms for all boards with LLM
    const results = [];
    
    for (const board of DEMO_JOB_BOARDS) {
      console.log(`\n🎯 Simulating posting to ${board.name}...`);
      
      const analysis = await analyzeJobFormWithLLM(MOCK_HTML_CONTENT, board.postUrl, board.name);
      
      results.push({
        board: board.name,
        board_id: board.id,
        url: board.postUrl,
        analysis,
        status: analysis.success ? 'success' : 'failed',
        simulated: true
      });
    }

    res.json({
      job_id: 'demo-job-' + Date.now(),
      job_data: jobData,
      posting_results: results,
      total_cost: results.reduce((sum, r) => sum + (r.analysis.cost || 0), 0),
      demo_note: "This is a simulated posting using LLM form analysis"
    });

  } catch (error) {
    console.error('Error in demo job posting:', error);
    res.status(500).json({ error: 'Demo posting failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    llm_provider: 'groq',
    demo_mode: true
  });
});

// Test LLM connection
app.get('/api/test-llm', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'user', content: 'Say "LLM connection successful"' }
      ],
      max_tokens: 10
    });

    const responseTime = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;

    res.json({
      success: true,
      provider: 'groq', 
      model: 'llama-3.1-8b-instant',
      response_time: responseTime,
      response: content,
      usage: response.usage
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      provider: 'groq',
      error: error.message
    });
  }
});

// Serve static demo page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Job Multi-Post LLM Demo</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .demo-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .api-example { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
        button { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #005a9e; }
        .result { background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 4px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>🤖 Job Multi-Post LLM Demo</h1>
      <p>This demo shows how Groq LLM analyzes job board forms and generates selectors automatically.</p>
      
      <div class="demo-section">
        <h2>🧪 Test LLM Connection</h2>
        <button onclick="testLLM()">Test Groq LLM</button>
        <div id="llm-result" class="result" style="display: none;"></div>
      </div>
      
      <div class="demo-section">
        <h2>📄 Analyze Job Form</h2>
        <input type="text" id="boardName" placeholder="Board Name (e.g. AngelList)" value="AngelList Demo">
        <button onclick="analyzeForm()">Analyze Form with LLM</button>
        <div id="analysis-result" class="result" style="display: none;"></div>
      </div>
      
      <div class="demo-section">
        <h2>⚖️ Compare Selectors</h2>
        <select id="boardSelect">
          <option value="1">AngelList</option>
          <option value="2">RemoteOK</option>
        </select>
        <button onclick="compareSelectors()">Compare LLM vs Hardcoded</button>
        <div id="compare-result" class="result" style="display: none;"></div>
      </div>
      
      <div class="demo-section">
        <h2>🚀 Simulate Job Posting</h2>
        <p>This will analyze forms for multiple boards and show how LLM would fill them:</p>
        <button onclick="simulatePosting()">Simulate Multi-Board Posting</button>
        <div id="posting-result" class="result" style="display: none;"></div>
      </div>
      
      <div class="demo-section">
        <h2>📚 API Examples</h2>
        <div class="api-example">
          <strong>GET /api/boards</strong> - List available job boards
        </div>
        <div class="api-example">
          <strong>POST /api/analyze-form</strong> - Analyze form with LLM<br>
          Body: { "boardName": "AngelList", "url": "https://angel.co/jobs/post" }
        </div>
        <div class="api-example">
          <strong>POST /api/compare-selectors</strong> - Compare LLM vs hardcoded<br>
          Body: { "boardId": "1" }
        </div>
        <div class="api-example">
          <strong>POST /api/jobs/demo</strong> - Simulate job posting<br>
          Body: { "title": "Software Engineer", "description": "...", "location": "Remote", "company": "TechCorp", "contactEmail": "hire@techcorp.com" }
        </div>
      </div>
      
      <script>
        async function testLLM() {
          const resultDiv = document.getElementById('llm-result');
          resultDiv.style.display = 'block';
          resultDiv.textContent = 'Testing LLM connection...';
          
          try {
            const response = await fetch('/api/test-llm');
            const result = await response.json();
            resultDiv.textContent = JSON.stringify(result, null, 2);
          } catch (error) {
            resultDiv.textContent = 'Error: ' + error.message;
          }
        }
        
        async function analyzeForm() {
          const boardName = document.getElementById('boardName').value;
          const resultDiv = document.getElementById('analysis-result');
          resultDiv.style.display = 'block';
          resultDiv.textContent = 'Analyzing form with LLM...';
          
          try {
            const response = await fetch('/api/analyze-form', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ boardName })
            });
            const result = await response.json();
            resultDiv.textContent = JSON.stringify(result, null, 2);
          } catch (error) {
            resultDiv.textContent = 'Error: ' + error.message;
          }
        }
        
        async function compareSelectors() {
          const boardId = document.getElementById('boardSelect').value;
          const resultDiv = document.getElementById('compare-result');
          resultDiv.style.display = 'block';
          resultDiv.textContent = 'Comparing selectors...';
          
          try {
            const response = await fetch('/api/compare-selectors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ boardId })
            });
            const result = await response.json();
            resultDiv.textContent = JSON.stringify(result, null, 2);
          } catch (error) {
            resultDiv.textContent = 'Error: ' + error.message;
          }
        }
        
        async function simulatePosting() {
          const resultDiv = document.getElementById('posting-result');
          resultDiv.style.display = 'block';
          resultDiv.textContent = 'Simulating multi-board posting with LLM...';
          
          const jobData = {
            title: "Senior Software Engineer",
            description: "We are seeking a talented Senior Software Engineer to join our growing team. You will work on cutting-edge projects using modern technologies including React, Node.js, and cloud infrastructure. Experience with LLM integration is a plus!",
            location: "San Francisco, CA / Remote",
            company: "TechCorp Innovation",
            contactEmail: "careers@techcorp.com",
            salaryMin: 120000,
            salaryMax: 180000
          };
          
          try {
            const response = await fetch('/api/jobs/demo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(jobData)
            });
            const result = await response.json();
            resultDiv.textContent = JSON.stringify(result, null, 2);
          } catch (error) {
            resultDiv.textContent = 'Error: ' + error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Job Multi-Post LLM Demo Server running on http://localhost:${PORT}`);
  console.log(`📖 Open http://localhost:${PORT} to see the interactive demo`);
  console.log(`🤖 LLM Provider: Groq (llama-3.1-8b-instant)`);
  console.log(`💡 Make sure to set GROQ_API_KEY environment variable for full functionality`);
});