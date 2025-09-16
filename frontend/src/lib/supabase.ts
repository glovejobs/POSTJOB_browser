import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client with fallback handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are available
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured && !supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
  });
}

export const supabase = supabaseInstance || (null as any); // Fallback for when Supabase is not configured

// Database types (matching Prisma schema)
export interface PostJobUser {
  id: string;
  email: string;
  api_key: string;
  full_name?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface JobBoard {
  id: string;
  name: string;
  base_url: string;
  post_url: string;
  selectors: any;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostJobJob {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  company: string;
  contact_email: string;
  employment_type?: string;
  department?: string;
  status: 'pending' | 'posting' | 'completed' | 'failed' | 'payment_pending';
  payment_intent_id?: string;
  payment_status: 'pending' | 'processing' | 'succeeded' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface JobPosting {
  id: string;
  job_id: string;
  board_id: string;
  status: 'pending' | 'posting' | 'success' | 'failed';
  external_url?: string;
  error_message?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for database operations
export const db = {
  // User operations
  users: {
    async findByEmail(email: string) {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase
        .from('postjob_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as PostJobUser | null;
    },

    async findByApiKey(apiKey: string) {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase
        .from('postjob_users')
        .select('*')
        .eq('api_key', apiKey)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as PostJobUser | null;
    },

    async create(user: Partial<PostJobUser>) {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase
        .from('postjob_users')
        .insert(user)
        .select()
        .single();

      if (error) throw error;
      return data as PostJobUser;
    },

    async update(id: string, updates: Partial<PostJobUser>) {
      const { data, error } = await supabase
        .from('postjob_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PostJobUser;
    },
  },

  // Job boards operations
  boards: {
    async list() {
      const { data, error } = await supabase
        .from('job_boards')
        .select('*')
        .eq('enabled', true)
        .order('name');

      if (error) throw error;
      return data as JobBoard[];
    },

    async findById(id: string) {
      const { data, error } = await supabase
        .from('job_boards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as JobBoard;
    },
  },

  // Jobs operations
  jobs: {
    async create(job: Partial<PostJobJob>) {
      const { data, error } = await supabase
        .from('postjob_jobs')
        .insert(job)
        .select()
        .single();

      if (error) throw error;
      return data as PostJobJob;
    },

    async findById(id: string) {
      const { data, error } = await supabase
        .from('postjob_jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PostJobJob;
    },

    async update(id: string, updates: Partial<PostJobJob>) {
      const { data, error } = await supabase
        .from('postjob_jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PostJobJob;
    },

    async listByUser(userId: string) {
      const { data, error } = await supabase
        .from('postjob_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PostJobJob[];
    },
  },

  // Job postings operations
  postings: {
    async create(posting: Partial<JobPosting>) {
      const { data, error } = await supabase
        .from('job_postings')
        .insert(posting)
        .select()
        .single();

      if (error) throw error;
      return data as JobPosting;
    },

    async listByJob(jobId: string) {
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          board:job_boards(*)
        `)
        .eq('job_id', jobId);

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<JobPosting>) {
      const { data, error } = await supabase
        .from('job_postings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as JobPosting;
    },
  },
};

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to job status changes
  onJobStatusChange(jobId: string, callback: (job: PostJobJob) => void) {
    return supabase
      .channel(`job:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'postjob_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload: any) => {
          callback(payload.new as PostJobJob);
        }
      )
      .subscribe();
  },

  // Subscribe to posting status changes
  onPostingStatusChange(jobId: string, callback: (posting: JobPosting) => void) {
    return supabase
      .channel(`postings:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_postings',
          filter: `job_id=eq.${jobId}`,
        },
        (payload: any) => {
          callback(payload.new as JobPosting);
        }
      )
      .subscribe();
  },
};

export default supabase;