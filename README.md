# Job Multi-Post MVP 🚀

A production-ready SaaS platform that allows users to post jobs to multiple university job boards with a single form submission. Built with Next.js, Express, PostgreSQL, and Playwright for browser automation.

## 🎯 Features

- ✅ Post to 5 university job boards simultaneously
- ✅ Real-time status updates via WebSocket
- ✅ Secure Stripe payment integration with Elements ($2.99 per post)
- ✅ Browser automation with Playwright and error handling
- ✅ Queue-based job processing with BullMQ
- ✅ Mobile-responsive interface
- ✅ API key-based authentication
- ✅ Production-ready deployment configuration

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Queue**: Redis with BullMQ
- **Browser Automation**: Playwright
- **Payment**: Stripe
- **Real-time**: Socket.IO

## Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Stripe account (for payment processing)

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd job-multipost-mvp
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database, Redis, and Stripe credentials

npm install
npx prisma migrate dev
npx prisma db seed
npm run playwright:install
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Add your Stripe publishable key

npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/job_multipost?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PER_JOB=299
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## API Documentation

### Authentication
All API endpoints require an `x-api-key` header.

### Endpoints

#### POST /api/auth/register
Register a new user and get an API key.

#### POST /api/jobs
Create a new job posting.

#### GET /api/jobs/:id/status
Get real-time status of a job posting.

#### GET /api/boards
List all available job boards.

## Deployment

### Backend (Railway)
1. Create a new Railway project
2. Add PostgreSQL and Redis services
3. Deploy using the provided Dockerfile
4. Set environment variables

### Frontend (Vercel)
1. Connect your GitHub repository
2. Deploy with automatic builds
3. Set environment variables

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Database Management
```bash
cd backend
npx prisma studio  # Open Prisma Studio
npx prisma migrate dev  # Run migrations
```

## Architecture

The system uses a queue-based architecture:

1. User submits job → Payment processed → Job queued
2. Worker picks up job from queue
3. Playwright automates posting to each board
4. Real-time updates sent via WebSocket
5. Results stored in database

## Job Boards Supported

1. Harvard University Careers
2. MIT Careers
3. Stanford Jobs
4. UC Berkeley Careers
5. NYU Careers

## 🚀 Production Deployment

### Backend Deployment (Railway.app)

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Environment Variables**: Set the following in Railway dashboard:
   ```env
   DATABASE_URL=<auto-provided-by-railway>
   REDIS_URL=<auto-provided-by-railway>
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PER_JOB=299
   JWT_SECRET=<generate-secure-random-string>
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
3. **Deploy**: Railway auto-detects Dockerfile and deploys

### Frontend Deployment (Vercel)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Set in Vercel dashboard:
   ```env
   NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
3. **Deploy**: Vercel auto-detects Next.js and deploys

### Post-Deployment

1. **Stripe Webhooks**: Configure webhook endpoint at:
   `https://your-railway-app.railway.app/api/webhooks/stripe`
   - Select event: `payment_intent.succeeded`
2. **Database Setup**: Railway automatically runs migrations on first deploy

## ⚠️ Known Limitations

- Job board selectors are hardcoded (may need updates if sites change)
- No retry UI for failed postings (only backend retries)
- Rate limiting is per-IP, not per-user (could be enhanced)

## Future Enhancements

- Add more job boards
- Email notifications
- Job posting analytics
- Bulk posting discounts
- API for programmatic access
- Advanced form validation

## License

MIT