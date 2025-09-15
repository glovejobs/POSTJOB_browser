const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Mock data
const mockBoards = [
  { id: '1', name: 'Harvard University Careers', baseUrl: 'https://harvard.edu/careers', enabled: true },
  { id: '2', name: 'MIT Careers', baseUrl: 'https://careers.mit.edu', enabled: true },
  { id: '3', name: 'Stanford Jobs', baseUrl: 'https://jobs.stanford.edu', enabled: true },
  { id: '4', name: 'UC Berkeley Careers', baseUrl: 'https://careers.berkeley.edu', enabled: true },
  { id: '5', name: 'NYU Careers', baseUrl: 'https://nyu.edu/careers', enabled: true }
];

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Job Multi-Post Backend API',
    frontend: 'http://localhost:3000',
    health: 'http://localhost:3001/health',
    boards: 'http://localhost:3001/api/boards'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/auth/register', (req, res) => {
  const { email } = req.body;
  res.json({
    id: '1',
    email: email || 'demo@example.com',
    apiKey: 'jmp_demo_key_123456789',
    message: 'Demo API key generated'
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
  res.json(mockBoards);
});

app.post('/api/jobs', (req, res) => {
  const jobData = req.body;
  console.log('Creating job:', jobData);
  
  // Simulate job creation
  res.json({
    jobId: 'demo-job-123',
    paymentIntent: {
      client_secret: 'pi_demo_secret_123',
      payment_intent_id: 'pi_demo_123'
    }
  });
});

app.get('/api/jobs/:id/status', (req, res) => {
  const jobId = req.params.id;
  
  res.json({
    job_id: jobId,
    overall_status: 'completed',
    postings: mockBoards.map((board, index) => ({
      board_id: board.id,
      board_name: board.name,
      status: index < 4 ? 'success' : 'pending',
      external_url: index < 4 ? `${board.baseUrl}/jobs/demo-${index}` : undefined,
      error_message: undefined
    }))
  });
});

app.post('/api/jobs/:id/confirm-payment', (req, res) => {
  const jobId = req.params.id;
  console.log('Payment confirmed for job:', jobId);
  
  res.json({
    message: 'Job queued for posting',
    jobId: jobId
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Demo server running on port ${PORT}`);
  console.log(`📋 Backend API: http://localhost:${PORT}`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
  console.log(`🏢 Job boards: http://localhost:${PORT}/api/boards`);
});