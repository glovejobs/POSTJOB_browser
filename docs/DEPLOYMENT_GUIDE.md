# Job Multi-Post MVP - Deployment Guide

## Project Status ✅

All critical components have been prepared and tested:

### ✅ Completed Tasks
1. **Backend TypeScript Compilation** - All errors fixed, builds successfully
2. **Frontend Next.js Build** - Compiles without errors
3. **Docker Configuration** - Both backend and frontend have production-ready Dockerfiles
4. **Deployment Files** - Railway.toml configured for backend
5. **API Structure** - All endpoints properly configured
6. **Authentication** - API key middleware working
7. **Payment Integration** - Stripe configuration in place

## 🚀 Production Deployment Instructions

### Prerequisites
- Railway account (for backend)
- Vercel account (for frontend)
- PostgreSQL database
- Redis instance
- Stripe account with API keys

### Backend Deployment (Railway)

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Initialize project in backend directory
   cd backend
   railway init
   ```

2. **Add Services in Railway Dashboard**
   - PostgreSQL (auto-provisioned)
   - Redis (auto-provisioned)

3. **Set Environment Variables in Railway**
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   JWT_SECRET=<generate-secure-random-string>
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PER_JOB=299
   NODE_ENV=production
   FRONTEND_URL=https://your-app.vercel.app
   PORT=3001
   ```

4. **Deploy Backend**
   ```bash
   railway up
   ```

5. **Run Database Migrations**
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma db seed
   ```

### Frontend Deployment (Vercel)

1. **Connect GitHub Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` directory as root

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

### Post-Deployment Configuration

1. **Configure Stripe Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-backend.railway.app/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`
   - Copy webhook secret to Railway environment

2. **Test the Deployment**
   ```bash
   # Test backend health
   curl https://your-backend.railway.app/health

   # Test frontend
   open https://your-app.vercel.app
   ```

## 🧪 Local Development Setup

### Starting Services Locally

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   # Runs on http://localhost:3001
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   # Runs on http://localhost:3000
   ```

### Required Local Services

For full local testing, you need:
- PostgreSQL (can use Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`)
- Redis (can use Docker: `docker run -p 6379:6379 redis`)

## 📊 Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Next.js   │────▶│  Express API │────▶│ PostgreSQL │
│  (Vercel)   │     │  (Railway)   │     └────────────┘
└─────────────┘     └──────────────┘            │
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌────────────┐
                    │   BullMQ     │────▶│   Redis    │
                    │   Worker     │     └────────────┘
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Playwright  │
                    │  Automation  │
                    └──────────────┘
```

## 🔧 Troubleshooting

### Common Issues

1. **Prisma Connection Issues**
   - Ensure DATABASE_URL is correctly formatted
   - Check if database is accessible from deployment environment
   - Run `npx prisma generate` after schema changes

2. **Redis Connection Failed**
   - Verify REDIS_URL includes protocol (redis://)
   - Check Redis service is running
   - Ensure no firewall blocking connection

3. **Stripe Webhook Errors**
   - Verify webhook secret matches dashboard
   - Check endpoint URL is correct
   - Ensure HTTPS is enabled

4. **Playwright Issues**
   - System dependencies are included in Dockerfile
   - Uses Alpine-compatible Chromium
   - Set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

## 📈 Monitoring

### Recommended Monitoring Setup

1. **Railway Metrics**
   - CPU/Memory usage
   - Request latency
   - Error rates

2. **Vercel Analytics**
   - Page load times
   - User geography
   - Error tracking

3. **Application Monitoring**
   - Sentry for error tracking
   - LogDNA for log aggregation
   - Stripe Dashboard for payment monitoring

## 🔐 Security Checklist

- [x] API keys stored as environment variables
- [x] HTTPS enforced on all endpoints
- [x] Input validation on all forms
- [x] SQL injection prevention via Prisma
- [x] Rate limiting configured
- [x] CORS properly configured
- [x] Stripe webhook signature verification

## 📝 API Documentation

### Authentication
All API calls require `x-api-key` header:
```bash
curl -H "x-api-key: your-api-key" https://api.example.com/api/boards
```

### Main Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/jobs` - Create job posting
- `GET /api/jobs/:id/status` - Get job status
- `GET /api/boards` - List job boards
- `WS /socket.io` - Real-time updates

## 🚦 Production Readiness Checklist

- [x] TypeScript compilation successful
- [x] Frontend builds without errors
- [x] Docker configuration optimized
- [x] Environment variables documented
- [x] Database schema defined
- [x] API endpoints tested
- [x] Authentication implemented
- [x] Payment integration configured
- [x] Error handling in place
- [x] Deployment configurations ready

## 📞 Support

For deployment issues:
1. Check Railway/Vercel logs
2. Verify environment variables
3. Test API endpoints individually
4. Review error messages in browser console

## Next Steps

1. **Add Custom Domain**
   - Configure domain in Vercel
   - Update CORS settings

2. **Enable Monitoring**
   - Add Sentry integration
   - Setup uptime monitoring

3. **Scale as Needed**
   - Increase Railway resources
   - Add more workers for queue processing

The application is now ready for production deployment! 🎉