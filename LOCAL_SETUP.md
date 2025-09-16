# 🚀 Local Development Setup

## Prerequisites Installation

### Option 1: Using Docker (Recommended - Easiest)
If you have Docker installed, run:
```bash
npm run docker:up
```
This will start PostgreSQL and Redis automatically.

### Option 2: Manual Installation

#### 1. PostgreSQL
**Windows:**
- Download from https://www.postgresql.org/download/windows/
- During installation, remember the password you set for 'postgres' user
- Default port is 5432

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2. Redis
**Windows:**
- Download from https://github.com/microsoftarchive/redis/releases
- Extract and run `redis-server.exe`
- Or use WSL: `wsl --install` then follow Linux instructions

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

## 🔧 Database Setup

1. **Create the database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE job_multipost;

# Exit
\q
```

2. **Update .env file:**
Edit `backend/.env` and update the DATABASE_URL:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/job_multipost?schema=public
```

3. **Run migrations:**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

## 🔑 Stripe Setup (For Payments)

1. Create a free account at https://stripe.com
2. Go to https://dashboard.stripe.com/test/apikeys
3. Copy your test keys and update:
   - `backend/.env`: STRIPE_SECRET_KEY
   - `frontend/.env.local`: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

## 🤖 LLM Setup (Optional - For AI Features)

Choose one provider:

### Groq (Recommended - Free tier available)
1. Sign up at https://console.groq.com
2. Get API key from https://console.groq.com/keys
3. Update `backend/.env`: GROQ_API_KEY

### OpenAI
1. Sign up at https://platform.openai.com
2. Get API key from https://platform.openai.com/api-keys
3. Update `backend/.env`: OPENAI_API_KEY

### Anthropic
1. Sign up at https://console.anthropic.com
2. Get API key
3. Update `backend/.env`: ANTHROPIC_API_KEY

## ✅ Verify Setup

1. **Check services are running:**
```bash
# PostgreSQL
psql -U postgres -c "SELECT 1"

# Redis
redis-cli ping
# Should return: PONG
```

2. **Run the application:**
```bash
npm run dev:all
```

3. **Visit:**
- Frontend: http://localhost:3000
- Backend Health: http://localhost:3001/health

## 🐛 Common Issues

### "Database connection failed"
- Make sure PostgreSQL is running
- Check password in DATABASE_URL
- Try: `postgresql://postgres:password@127.0.0.1:5432/job_multipost`

### "Redis connection failed"
- Make sure Redis is running
- Check if port 6379 is available
- Try: `redis://127.0.0.1:6379`

### "Port already in use"
- Kill existing processes:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F

  # Mac/Linux
  lsof -i :3000
  kill -9 <PID>
  ```

### "Stripe error"
- Make sure you're using test keys (start with `sk_test_` and `pk_test_`)
- Don't use production keys in development

## 📝 Quick Checklist

- [ ] PostgreSQL installed and running
- [ ] Redis installed and running
- [ ] Database created (`job_multipost`)
- [ ] Backend `.env` file configured
- [ ] Frontend `.env.local` file configured
- [ ] Stripe test keys added
- [ ] (Optional) LLM API key added
- [ ] Migrations run (`npx prisma migrate dev`)
- [ ] Dependencies installed (`npm run install:all`)

Once everything is checked, run:
```bash
npm run dev:all
```

You're ready to go! 🎉