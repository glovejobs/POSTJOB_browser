#!/bin/bash

# Railway Deployment Script for Job Multi-Post MVP
# This script automates the deployment process to Railway

set -e

echo "🚂 Railway Deployment Script for Job Multi-Post MVP"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate secure random string
generate_secret() {
    openssl rand -hex 32
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command_exists railway; then
    echo -e "${RED}Railway CLI not found!${NC}"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Navigate to backend directory
cd backend

# Login to Railway
echo -e "\n${YELLOW}Logging into Railway...${NC}"
railway login

# Initialize or link project
echo -e "\n${YELLOW}Setting up Railway project...${NC}"
if [ ! -f ".railway/config.json" ]; then
    echo "Initializing new Railway project..."
    railway init
else
    echo "Railway project already configured"
fi

# Add services
echo -e "\n${YELLOW}Adding services...${NC}"

echo "Adding PostgreSQL..."
railway add postgresql || echo "PostgreSQL may already be added"

echo "Adding Redis..."
railway add redis || echo "Redis may already be added"

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(generate_secret)
    echo -e "\n${GREEN}Generated JWT Secret: $JWT_SECRET${NC}"
fi

# Set environment variables
echo -e "\n${YELLOW}Setting environment variables...${NC}"

# Required variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET="$JWT_SECRET"

# Stripe configuration
echo -e "\n${YELLOW}Configure Stripe settings:${NC}"
read -p "Enter Stripe Secret Key (sk_test_...): " STRIPE_SECRET_KEY
read -p "Enter Stripe Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET
railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
railway variables set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
railway variables set STRIPE_PRICE_PER_JOB=299

# Frontend URL
read -p "Enter Frontend URL (e.g., https://app.vercel.app): " FRONTEND_URL
railway variables set FRONTEND_URL="$FRONTEND_URL"

# LLM Configuration
echo -e "\n${YELLOW}Configure LLM Provider:${NC}"
echo "1) Anthropic (Claude)"
echo "2) OpenAI (GPT-4)"
echo "3) Groq (Fast inference)"
read -p "Select LLM provider (1-3): " LLM_CHOICE

case $LLM_CHOICE in
    1)
        railway variables set LLM_PROVIDER=anthropic
        read -p "Enter Anthropic API Key (sk-ant-...): " ANTHROPIC_KEY
        railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
        ;;
    2)
        railway variables set LLM_PROVIDER=openai
        read -p "Enter OpenAI API Key (sk-...): " OPENAI_KEY
        railway variables set OPENAI_API_KEY="$OPENAI_KEY"
        ;;
    3)
        railway variables set LLM_PROVIDER=groq
        read -p "Enter Groq API Key (gsk_...): " GROQ_KEY
        railway variables set GROQ_API_KEY="$GROQ_KEY"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Optional fallback provider
read -p "Configure fallback LLM provider? (y/n): " CONFIGURE_FALLBACK
if [ "$CONFIGURE_FALLBACK" = "y" ]; then
    read -p "Enter fallback provider (groq/openai/anthropic): " FALLBACK_PROVIDER
    railway variables set LLM_FALLBACK_PROVIDER="$FALLBACK_PROVIDER"

    case $FALLBACK_PROVIDER in
        groq)
            read -p "Enter Groq API Key: " GROQ_KEY
            railway variables set GROQ_API_KEY="$GROQ_KEY"
            ;;
        openai)
            read -p "Enter OpenAI API Key: " OPENAI_KEY
            railway variables set OPENAI_API_KEY="$OPENAI_KEY"
            ;;
        anthropic)
            read -p "Enter Anthropic API Key: " ANTHROPIC_KEY
            railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
            ;;
    esac
fi

# Deploy
echo -e "\n${YELLOW}Deploying to Railway...${NC}"
railway up

# Get deployment URL
echo -e "\n${YELLOW}Getting deployment URL...${NC}"
DEPLOY_URL=$(railway status --json | grep -o '"domain":"[^"]*' | cut -d'"' -f4)

if [ -z "$DEPLOY_URL" ]; then
    echo -e "${YELLOW}Generating Railway domain...${NC}"
    railway domain
    DEPLOY_URL=$(railway status --json | grep -o '"domain":"[^"]*' | cut -d'"' -f4)
fi

# Run migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
railway run npm run migrate || echo "Migration may have already been run"

# Seed database
read -p "Seed database with initial data? (y/n): " SEED_DB
if [ "$SEED_DB" = "y" ]; then
    railway run npm run seed || echo "Database may already be seeded"
fi

# Display success message
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "\nYour backend is deployed at: ${GREEN}https://$DEPLOY_URL${NC}"
echo -e "\nNext steps:"
echo -e "1. Configure Stripe webhook at: https://$DEPLOY_URL/api/webhooks/stripe"
echo -e "2. Deploy frontend to Vercel with API URL: https://$DEPLOY_URL"
echo -e "3. Test the application"

# Open Railway dashboard
read -p "Open Railway dashboard? (y/n): " OPEN_DASHBOARD
if [ "$OPEN_DASHBOARD" = "y" ]; then
    railway open
fi

echo -e "\n${GREEN}Deployment script completed!${NC}"