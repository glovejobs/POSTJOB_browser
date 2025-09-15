#!/usr/bin/env node

/**
 * Railway Database & Redis Setup Script
 * Ensures database is properly configured after deployment
 */

const { execSync } = require('child_process');

console.log('🚂 Railway Post-Deployment Setup');
console.log('================================\n');

async function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function setup() {
  // Check environment
  const isProduction = process.env.NODE_ENV === 'production';
  const hasDatabase = !!process.env.DATABASE_URL;
  const hasRedis = !!process.env.REDIS_URL;

  console.log('Environment Check:');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`- DATABASE_URL: ${hasDatabase ? '✅ Set' : '❌ Not set'}`);
  console.log(`- REDIS_URL: ${hasRedis ? '✅ Set' : '❌ Not set'}`);
  console.log('');

  if (!hasDatabase) {
    console.error('❌ DATABASE_URL not found. Please add PostgreSQL to your Railway project.');
    process.exit(1);
  }

  // Generate Prisma Client
  await runCommand('npx prisma generate', 'Generating Prisma Client');

  // Run migrations
  if (isProduction) {
    await runCommand('npx prisma migrate deploy', 'Running production migrations');
  } else {
    await runCommand('npx prisma migrate dev --name init', 'Running development migrations');
  }

  // Test database connection
  console.log('🔍 Testing database connection...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if we need to seed
    const userCount = await prisma.user.count();
    const boardCount = await prisma.jobBoard.count();

    console.log(`\nDatabase Status:`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Job Boards: ${boardCount}`);

    if (boardCount === 0) {
      console.log('\n📝 No job boards found. Running seed...');
      await runCommand('npm run seed', 'Seeding database');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }

  // Test Redis connection if available
  if (hasRedis) {
    console.log('\n🔍 Testing Redis connection...');
    try {
      const redis = require('redis');
      const client = redis.createClient({ url: process.env.REDIS_URL });

      await client.connect();
      await client.ping();
      console.log('✅ Redis connection successful');
      await client.quit();
    } catch (error) {
      console.error('⚠️  Redis test failed (non-critical):', error.message);
    }
  }

  console.log('\n🎉 Railway setup completed successfully!');
  console.log('\nYour application is ready to receive requests.');
}

// Run setup
setup().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});