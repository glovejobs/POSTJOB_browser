# Railway Quick Start Guide 🚂

## Deploy in 3 Minutes

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Deploy Backend
```bash
cd backend
railway login
railway init
railway add postgresql
railway add redis
railway up
```

### Step 3: Set Environment Variables
Go to [railway.app](https://railway.app) dashboard and add:

```env
# Required
JWT_SECRET=generate-random-string-here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
STRIPE_PRICE_PER_JOB=299
FRONTEND_URL=https://your-app.vercel.app

# LLM (Choose one)
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### Step 4: Run Migrations
```bash
railway run npm run migrate
railway run npm run seed
```

### Step 5: Get Your URL
```bash
railway open
```

## Alternative: Use the Automated Script

```bash
# Run the automated deployment script
./deploy-railway.sh
```

This script will:
- ✅ Login to Railway
- ✅ Create project
- ✅ Add PostgreSQL and Redis
- ✅ Configure all environment variables
- ✅ Deploy your application
- ✅ Run migrations
- ✅ Provide your deployment URL

## Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| Backend | ~$5 |
| PostgreSQL | ~$10 |
| Redis | ~$5 |
| **Total** | **~$20/month** |

## LLM Configuration

The project includes AI-powered job posting with support for:
- **Anthropic Claude** (Recommended)
- **OpenAI GPT-4**
- **Groq** (Fast & cheap)

Add your preferred provider's API key in Railway dashboard.

## Stripe Setup

1. Get your keys from [Stripe Dashboard](https://dashboard.stripe.com)
2. Create webhook endpoint: `https://your-app.railway.app/api/webhooks/stripe`
3. Select event: `payment_intent.succeeded`
4. Add webhook secret to Railway

## Frontend Deployment (Vercel)

```bash
cd ../frontend
vercel --prod
```

Add environment variable in Vercel:
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Verification

Test your deployment:
```bash
# Check health
curl https://your-app.railway.app/health

# View logs
railway logs
```

## Support

- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Docs: [docs.railway.app](https://docs.railway.app)

Your app is ready! 🎉