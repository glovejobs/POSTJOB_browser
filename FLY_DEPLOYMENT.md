# Deploy to Fly.io - Free & Managed Setup

## Why Fly.io is Better than Render

| Feature | Fly.io | Render |
|---------|---------|---------|
| **Free Tier** | 3 VMs, 3GB RAM | 512MB RAM, 750hrs |
| **PostgreSQL** | Free 1GB | Free 1GB (90 days) |
| **Redis** | Free built-in | $10/month |
| **Auto-scaling** | ✅ Free | ❌ Paid only |
| **Global Deploy** | ✅ 30+ regions | ❌ 4 regions |
| **Persistent Storage** | ✅ Free 1GB | ❌ Paid only |
| **IPv6** | ✅ Free | ❌ Not available |
| **Limit** | No sleep | Sleeps after 15min |

## 🚀 Quick Deploy (5 Minutes)

### 1. Install Fly CLI
```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### 2. Login & Launch
```bash
fly auth login
fly launch --dockerfile backend/Dockerfile
```

### 3. Create Free Database & Redis
```bash
# PostgreSQL (Free 1GB)
fly postgres create --name job-multipost-db
fly postgres attach job-multipost-db

# Redis (Free built-in)
fly redis create --name job-multipost-redis
fly redis attach job-multipost-redis
```

### 4. Set Secrets
```bash
fly secrets set \
  JWT_SECRET=$(openssl rand -hex 32) \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  STRIPE_PRICE_PER_JOB=299 \
  LLM_PROVIDER=anthropic \
  ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Deploy
```bash
fly deploy
fly open
```

## 🎯 Complete Setup for Job Multi-Post

### Backend (Fly.io)
```bash
cd backend
fly launch --name job-multipost-api
fly postgres create
fly redis create
fly secrets set STRIPE_SECRET_KEY=...
fly deploy
```

### Frontend (Vercel - Still Free)
```bash
cd frontend
vercel --prod
```

### Total Cost: $0/month ✅

## Environment Variables for Fly.io

```bash
# Automatic from Fly.io
DATABASE_URL         # Auto-set by fly postgres attach
REDIS_URL           # Auto-set by fly redis attach
PORT=8080           # Fly.io standard

# Manual secrets to set
fly secrets set \
  JWT_SECRET="your-secret-here" \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  FRONTEND_URL="https://your-app.vercel.app" \
  LLM_PROVIDER="anthropic" \
  ANTHROPIC_API_KEY="sk-ant-..."
```

## Monitoring & Logs

```bash
# View logs
fly logs

# Monitor metrics
fly dashboard

# SSH into container
fly ssh console

# Scale up/down
fly scale count 2  # Add instances
fly scale memory 512  # Increase RAM
```

## Database Management

```bash
# Connect to PostgreSQL
fly postgres connect -a job-multipost-db

# Run migrations
fly ssh console -C "npm run migrate"

# Backup database
fly postgres backup create
```

## Advantages Over Other Platforms

### vs Render
- ✅ Better free tier (3GB vs 512MB)
- ✅ Free Redis included
- ✅ No sleep timeout
- ✅ Global deployment

### vs Railway
- ✅ Actually free (not $5 credit)
- ✅ More regions
- ✅ Better scaling options

### vs Heroku
- ✅ No credit card required
- ✅ Faster cold starts
- ✅ Better free database

## Troubleshooting

### Port Issues
```toml
# Fly.io uses PORT 8080 by default
[env]
  PORT = "8080"
```

### Database Connection
```bash
# Check connection
fly postgres connect -a job-multipost-db
SELECT version();
```

### Redis Connection
```bash
# Verify Redis
fly redis connect
PING
```

## Production Optimizations

### 1. Auto-scaling Configuration
```toml
[http_service]
  min_machines_running = 0  # Scale to zero
  max_machines_running = 3  # Auto-scale up
```

### 2. Health Checks
```toml
[[services.http_checks]]
  interval = "30s"
  grace_period = "5s"
  method = "get"
  path = "/health"
  timeout = "2s"
```

### 3. Persistent Storage
```toml
[mounts]
  source = "data"
  destination = "/data"
```

## Cost Breakdown

| Service | Fly.io | Render | Railway |
|---------|--------|--------|---------|
| Compute | Free (3 VMs) | Free (750hrs) | $5 credit |
| Database | Free (1GB) | Free (90 days) | Usage-based |
| Redis | Free | $10/month | Usage-based |
| Storage | Free (1GB) | ❌ | Usage-based |
| **Total** | **$0** | **$10+** | **~$20** |

## Deploy Now!

```bash
# Complete deployment in 3 commands
fly launch
fly postgres create
fly deploy

# Your app is live! 🚀
```

---

**Fly.io is the winner**: Free, managed, scalable, and production-ready!