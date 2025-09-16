# Supabase Database Setup

This document explains how the PostJob application is connected to Supabase for database operations and real-time features.

## Overview

PostJob uses Supabase as its primary database (PostgreSQL) with the following benefits:
- Real-time subscriptions for job status updates
- Row Level Security (RLS) for data protection
- Built-in authentication support
- Automatic API generation
- Edge functions for serverless processing

## Database Configuration

### Project Details
- **Project ID**: xyhpacncapfzwcqhfgtg
- **Project Name**: Job recruiter site
- **Region**: us-west-1
- **Database Host**: db.xyhpacncapfzwcqhfgtg.supabase.co

### Database Schema

The application uses the following tables:

#### 1. `postjob_users`
Stores user information separate from auth.users for application-specific data.
- `id`: UUID (Primary Key)
- `email`: User's email address (unique)
- `api_key`: API key for authentication (unique)
- `full_name`: User's full name
- `stripe_customer_id`: Stripe customer ID for payments
- `created_at`: Timestamp
- `updated_at`: Timestamp

#### 2. `job_boards`
Contains the list of university job boards.
- `id`: UUID (Primary Key)
- `name`: Board name (e.g., "Harvard University")
- `base_url`: Base URL of the job board
- `post_url`: URL for posting jobs
- `selectors`: JSON object with CSS selectors
- `enabled`: Boolean flag
- `created_at`: Timestamp
- `updated_at`: Timestamp

#### 3. `postjob_jobs`
Stores job postings created by users.
- `id`: UUID (Primary Key)
- `user_id`: Reference to postjob_users
- `title`: Job title
- `description`: Job description
- `location`: Job location
- `salary_min`: Minimum salary
- `salary_max`: Maximum salary
- `company`: Company name
- `contact_email`: Contact email
- `employment_type`: Type of employment
- `department`: Department
- `status`: Job status (pending, posting, completed, failed, payment_pending)
- `payment_intent_id`: Stripe payment intent ID
- `payment_status`: Payment status
- `created_at`: Timestamp
- `updated_at`: Timestamp

#### 4. `job_postings`
Tracks individual postings to each job board.
- `id`: UUID (Primary Key)
- `job_id`: Reference to postjob_jobs
- `board_id`: Reference to job_boards
- `status`: Posting status (pending, posting, success, failed)
- `external_url`: URL of the posted job
- `error_message`: Error message if failed
- `posted_at`: Timestamp when posted
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Environment Variables

### Backend (.env)
```env
# Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@db.xyhpacncapfzwcqhfgtg.supabase.co:5432/postgres"

# Supabase API
SUPABASE_URL="https://xyhpacncapfzwcqhfgtg.supabase.co"
SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_KEY="[YOUR_SERVICE_KEY]"
```

### Frontend (.env.local)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xyhpacncapfzwcqhfgtg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

## Getting Your Database Password

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (Job recruiter site)
3. Navigate to Settings > Database
4. Find your database password or reset it if needed

## Row Level Security (RLS)

The database implements RLS policies to ensure:
- Users can only view and modify their own data
- Job boards are publicly readable
- Job postings can only be viewed by the job owner
- System operations have appropriate permissions

### Key RLS Policies

1. **Users Table**
   - Users can view their own data (filtered by API key)
   - Users can update their own data

2. **Jobs Table**
   - Users can view their own jobs
   - Users can create jobs under their account
   - Users can update their own jobs

3. **Job Postings**
   - Users can view postings for their jobs
   - System can create and update postings

## Real-time Subscriptions

The frontend uses Supabase real-time subscriptions for:
- Job status updates
- Posting progress tracking
- Live notifications

Example usage:
```typescript
import { subscriptions } from '@/lib/supabase';

// Subscribe to job status changes
const subscription = subscriptions.onJobStatusChange(jobId, (job) => {
  console.log('Job status updated:', job.status);
});

// Cleanup
subscription.unsubscribe();
```

## Hybrid Architecture

PostJob uses a hybrid approach:
1. **Backend API**: Handles business logic, payments, and queue processing
2. **Supabase Direct**: Provides real-time updates and fast data access
3. **Fallback Pattern**: If Supabase fails, falls back to backend API

## Data Flow

1. **User Registration/Login**
   - Backend creates user and generates API key
   - User data synced to Supabase for real-time features

2. **Job Creation**
   - Backend handles payment processing via Stripe
   - Job created in backend database
   - Job synced to Supabase for real-time tracking

3. **Job Posting**
   - Backend queue processes job posting via Playwright
   - Status updates written to both databases
   - Frontend receives real-time updates via Supabase

4. **Status Checking**
   - Frontend first checks Supabase for instant data
   - Falls back to backend API if needed

## Migrations

Database migrations are managed through Supabase migrations. To apply a new migration:

```typescript
// Using Supabase MCP
await applyMigration({
  project_id: 'xyhpacncapfzwcqhfgtg',
  name: 'migration_name',
  query: 'SQL_QUERY_HERE'
});
```

## Security Notes

1. **Never commit service keys**: The service key has admin privileges
2. **Use RLS**: Always enable Row Level Security on tables
3. **API Key rotation**: Regularly rotate API keys for security
4. **Environment variables**: Keep all credentials in .env files
5. **CORS configuration**: Configure CORS properly for production

## Troubleshooting

### Connection Issues
- Verify DATABASE_URL format and password
- Check if project is active (not paused)
- Ensure IP is not blocked in Supabase dashboard

### RLS Issues
- Check if RLS is enabled on tables
- Verify policies are correctly configured
- Use service key for admin operations

### Real-time Not Working
- Check if real-time is enabled for tables
- Verify WebSocket connection
- Check browser console for errors

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Project Dashboard: https://app.supabase.com/project/xyhpacncapfzwcqhfgtg