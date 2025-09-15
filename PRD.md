# Claude Code PRD: Job Multi-Post MVP

## Project Overview
Build a SaaS platform where users post a job once and it automatically gets posted to 5 job boards using browser automation. Free tier deployment, pay-per-post pricing model.

## Technical Specifications

### Stack Requirements
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Node.js Express API with TypeScript  
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis with Bull/BullMQ for job processing
- **Browser Automation**: Playwright for headless automation
- **Authentication**: Simple API key authentication
- **Payment**: Stripe integration for pay-per-post
- **Deployment**: Railway.app (backend) + Vercel (frontend)
- **Real-time**: WebSocket for status updates

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Job boards registry
CREATE TABLE job_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  base_url VARCHAR(255) NOT NULL,
  post_url VARCHAR(255) NOT NULL,
  selectors JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true
);

-- Jobs submitted by users  
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  salary_min INTEGER,
  salary_max INTEGER,
  company VARCHAR(255),
  contact_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual postings to job boards
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  board_id UUID REFERENCES job_boards(id),
  status VARCHAR(50) DEFAULT 'pending',
  external_url VARCHAR(500),
  error_message TEXT,
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints Required
```typescript
// POST /api/jobs - Create and queue job for posting
interface CreateJobRequest {
  title: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  company: string;
  contact_email: string;
}

// GET /api/jobs/:id/status - Get job posting status
interface JobStatusResponse {
  job_id: string;
  overall_status: 'pending' | 'posting' | 'completed' | 'failed';
  postings: Array<{
    board_name: string;
    status: 'pending' | 'posting' | 'success' | 'failed';
    external_url?: string;
    error_message?: string;
  }>;
}

// GET /api/boards - List available job boards
interface JobBoard {
  id: string;
  name: string;
  enabled: boolean;
}

// WebSocket /api/status/:job_id - Real-time status updates
```

## Target Job Boards (Initial 5)

### 1. Harvard University Careers
- **URL**: https://harvard.edu/careers
- **Post URL**: https://harvard.edu/careers/post-position
- **Selectors**: 
  ```json
  {
    "title": "#position-title",
    "description": "#position-description", 
    "location": "#work-location",
    "submit": "#submit-position"
  }
  ```

### 2. MIT Careers  
- **URL**: https://careers.mit.edu
- **Post URL**: https://careers.mit.edu/post-job
- **Selectors**:
  ```json
  {
    "title": "[name='job_title']",
    "description": "[name='job_description']",
    "location": "[name='location']", 
    "submit": ".submit-btn"
  }
  ```

### 3. Stanford Jobs
- **URL**: https://jobs.stanford.edu  
- **Post URL**: https://jobs.stanford.edu/post
- **Selectors**:
  ```json
  {
    "title": "#jobTitle",
    "description": "#jobDescription",
    "location": "#jobLocation",
    "submit": "[type='submit']"
  }
  ```

### 4. UC Berkeley Careers
- **URL**: https://careers.berkeley.edu
- **Post URL**: https://careers.berkeley.edu/employers/post-job
- **Selectors**:
  ```json
  {
    "title": "#title",
    "description": "#description",
    "location": "#location",
    "submit": "#post-job-btn"
  }
  ```

### 5. NYU Careers
- **URL**: https://nyu.edu/careers
- **Post URL**: https://nyu.edu/careers/employers/post-position  
- **Selectors**:
  ```json
  {
    "title": "[data-field='title']",
    "description": "[data-field='description']",
    "location": "[data-field='location']",
    "submit": "[data-action='submit']"
  }
  ```

## Core Features Required

### 1. Job Creation Form (Frontend)
```typescript
interface JobFormProps {
  onSubmit: (job: CreateJobRequest) => void;
  loading: boolean;
}

// Required fields:
// - Job title (required)
// - Job description (required, textarea)
// - Location (required)
// - Salary range (optional, min/max)
// - Company name (required)
// - Contact email (required)
// - Board selection (checkboxes, default all selected)
```

### 2. Browser Automation Engine (Backend)
```typescript
class JobPoster {
  async postToBoard(board: JobBoard, job: Job): Promise<PostingResult> {
    // Launch headless browser
    // Navigate to board post URL  
    // Fill form using selectors
    // Submit and verify success
    // Return result with external URL or error
  }
  
  async processJob(jobId: string): Promise<void> {
    // Get job and target boards
    // Post to all boards in parallel
    // Update status in database
    // Send WebSocket updates
  }
}
```

### 3. Status Dashboard (Frontend)
```typescript
interface StatusDashboardProps {
  jobId: string;
}

// Display:
// - Overall progress (X of Y boards completed)
// - Per-board status with icons
// - Success: Green checkmark + external URL
// - Pending: Loading spinner
// - Failed: Red X + error message
// - Real-time updates via WebSocket
```

### 4. Payment Integration
```typescript
// Stripe integration for pay-per-post
// $2.99 per job posting
// Process payment before starting automation
// Webhook to handle payment confirmations
```

## Browser Automation Requirements

### Playwright Configuration
```typescript
const browser = await playwright.chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ]
});
```

### Error Handling
- Retry failed postings up to 3 times
- Screenshot on failure for debugging
- Graceful degradation if one board fails
- Detailed error logging

### Success Verification
- Wait for success confirmation page
- Extract external job URL if available
- Timeout after 2 minutes per board
- Mark as success only if verified

## Deployment Configuration

### Railway.app Backend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx playwright install chromium
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=...
NODE_ENV=production
```

### Vercel Frontend
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

## User Experience Flow

### 1. Job Creation
- User fills out job form
- Selects target boards (all by default)
- Clicks "Post Job - $2.99"
- Stripe payment modal appears
- After payment success, job is queued

### 2. Processing
- User redirected to status page
- Real-time updates show progress
- "Posting to Harvard... ✓ Success!"
- "Posting to MIT... 🔄 In progress"
- Final summary with all external URLs

### 3. Results
- Success rate displayed (4/5 boards)
- Links to live job postings
- Email confirmation sent
- Option to post another job

## Acceptance Criteria

### MVP Success Criteria
- [ ] User can create account and get API key
- [ ] Job form accepts all required fields
- [ ] Payment processing works with Stripe
- [ ] Browser automation posts to all 5 boards
- [ ] Real-time status updates work via WebSocket
- [ ] 90%+ success rate on job postings
- [ ] Average posting time under 5 minutes
- [ ] Mobile-responsive interface
- [ ] Error handling and retry logic
- [ ] Email confirmations sent

### Performance Requirements
- API response time < 500ms
- Job processing complete within 5 minutes
- Support 10 concurrent job postings
- 99% uptime on free tier infrastructure

### Security Requirements
- API key authentication for all endpoints
- Input validation and sanitization
- Secure credential storage (if needed)
- Rate limiting (max 5 jobs per user per hour)

## Implementation Priority

### Phase 1 (Week 1)
1. Database schema and API setup
2. Basic job creation form
3. Stripe payment integration
4. Job queue infrastructure

### Phase 2 (Week 2)  
1. Browser automation for 5 boards
2. Status tracking and WebSocket updates
3. Error handling and retry logic
4. Frontend status dashboard

### Phase 3 (Week 3)
1. Email confirmations
2. User authentication and API keys
3. Rate limiting and security
4. Deployment and testing

### Phase 4 (Week 4)
1. Bug fixes and optimization
2. Mobile responsiveness
3. Analytics and monitoring
4. Launch preparation

## Success Metrics

### Technical Metrics
- Job posting success rate: >90%
- Average processing time: <5 minutes
- API uptime: >99%
- Error rate: <5%

### Business Metrics  
- First paying customer within 1 week
- 10 paying customers within 1 month
- $100 monthly revenue within 3 months
- Customer satisfaction: >4/5 stars

## File Structure Expected
```
job-multipost-mvp/
├── frontend/                    # Next.js app
│   ├── pages/
│   ├── components/
│   ├── styles/
│   └── package.json
├── backend/                     # Express API
│   ├── src/
│   │   ├── api/routes/
│   │   ├── automation/
│   │   ├── database/
│   │   ├── queue/
│   │   └── websocket/
│   ├── prisma/
│   ├── Dockerfile
│   └── package.json
├── shared/                      # Shared types
│   └── types.ts
└── README.md
```

This PRD is ready to paste into Claude Code to start building immediately.