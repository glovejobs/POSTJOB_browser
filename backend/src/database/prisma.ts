// This file maintains backward compatibility while using Supabase
import supabase from './supabase';

// Export supabase client as default to maintain compatibility
export default supabase;

// Helper types for database tables
export interface User {
  id: string;
  email: string;
  api_key: string;
  password: string;
  full_name?: string | null;
  company?: string | null;
  phone?: string | null;
  website?: string | null;
  bio?: string | null;
  avatar?: string | null;
  email_preferences?: any;
  stripe_customer_id?: string | null;
  reset_password_token?: string | null;
  reset_password_expires?: Date | null;
  email_verified: boolean;
  email_verification_token?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  salary_min?: number | null;
  salary_max?: number | null;
  company: string;
  contact_email: string;
  employment_type?: string | null;
  department?: string | null;
  status: string;
  payment_intent_id?: string | null;
  payment_status: string;
  created_at: Date;
  updated_at: Date;
}

export interface JobBoard {
  id: string;
  name: string;
  base_url: string;
  post_url: string;
  selectors: any;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JobPosting {
  id: string;
  job_id: string;
  board_id: string;
  status: string;
  external_url?: string | null;
  error_message?: string | null;
  posted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string | null;
  resume_url?: string | null;
  cover_letter?: string | null;
  portfolio?: string | null;
  linkedin_url?: string | null;
  status: string;
  score?: number | null;
  notes?: string | null;
  applied_at: Date;
  updated_at: Date;
}