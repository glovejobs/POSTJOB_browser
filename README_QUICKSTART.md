# 🚀 Quick Start Guide

## One-Command Setup & Run

From the root directory, you can now manage everything with simple commands:

### 🎯 Run Everything (Recommended)
```bash
# From root directory
npm run dev:all
```
This starts both backend (port 3001) and frontend (port 3000) simultaneously.

### 📦 First Time Setup
```bash
# 1. Install all dependencies
npm run install:all

# 2. Setup environment files (then edit them)
npm run setup:env

# 3. Setup database
npm run setup:db

# 4. Run everything
npm run dev:all
```

## 📋 Available Root Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Run backend & frontend in development mode |
| `npm run install:all` | Install dependencies for all packages |
| `npm run build:all` | Build both backend & frontend |
| `npm run start:all` | Run both in production mode |
| `npm run setup` | Complete setup (install, env, database) |
| `npm run prisma:studio` | Open database GUI |
| `npm run test:all` | Run all tests |
| `npm run docker:up` | Start Docker services (PostgreSQL, Redis) |
| `npm run docker:down` | Stop Docker services |

## 🔧 Individual Services

If you need to run services separately:

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## 🎨 Console Output

When running `npm run dev:all`, you'll see color-coded output:
- 🟡 **Yellow**: Backend logs
- 🔵 **Cyan**: Frontend logs

## 📝 Environment Files

Before running, make sure to configure:
- `backend/.env` - Database, Redis, Stripe keys
- `frontend/.env.local` - API URL, Stripe public key

## 🌐 Access URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

## 🐛 Troubleshooting

If `npm run dev:all` doesn't work:
1. Make sure you're in the root directory
2. Run `npm install` first (installs concurrently)
3. Check that ports 3000 and 3001 are available
4. Ensure PostgreSQL and Redis are running