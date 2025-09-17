import axios from 'axios';
import { CreateJobRequest, JobStatusResponse, JobBoard, Job } from '../../../shared/types';
import { db, supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add API key to requests if available
api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('api_key');
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }
  return config;
});

// Auth endpoints - Hybrid approach using both backend and Supabase
export const auth = {
  register: async (email: string) => {
    try {
      // First, create user in backend (handles API key generation)
      const { data } = await api.post('/api/auth/register', { email });

      // Also create/sync user in Supabase for real-time features
      try {
        await db.users.create({
          email,
          api_key: data.apiKey,
          full_name: localStorage.getItem('user_name') || undefined,
        });
      } catch (supabaseError) {
        // If Supabase fails, log but don't block the registration
        console.error('Supabase sync failed:', supabaseError);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  login: async (email: string) => {
    try {
      // First try backend login
      const { data } = await api.post('/api/auth/login', { email });

      // Sync with Supabase if needed
      try {
        const existingUser = await db.users.findByEmail(email).catch(() => null);
        if (!existingUser) {
          await db.users.create({
            email,
            api_key: data.apiKey,
            full_name: localStorage.getItem('user_name') || undefined,
          });
        }
      } catch (supabaseError) {
        console.error('Supabase sync failed:', supabaseError);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  me: async () => {
    const { data } = await api.get('/api/auth/me');
    return data;
  },

  // New method to get user from Supabase directly
  getUserFromSupabase: async (apiKey: string) => {
    try {
      return await db.users.findByApiKey(apiKey);
    } catch (error) {
      console.error('Failed to get user from Supabase:', error);
      return null;
    }
  }
};

// Job boards endpoints - Use Supabase directly for better performance
export const boards = {
  list: async (): Promise<JobBoard[]> => {
    try {
      // Try Supabase first for real-time data
      const supabaseBoards = await db.boards.list();
      if (supabaseBoards && supabaseBoards.length > 0) {
        return supabaseBoards.map(board => ({
          id: board.id,
          name: board.name,
          base_url: board.base_url,
          post_url: board.post_url,
          selectors: board.selectors,
          enabled: board.enabled,
        }));
      }
    } catch (supabaseError) {
      console.error('Supabase boards fetch failed, falling back to API:', supabaseError);
    }

    // Fallback to backend API
    const { data } = await api.get('/api/boards');
    return data;
  },

  get: async (id: string): Promise<JobBoard> => {
    try {
      const board = await db.boards.findById(id);
      if (board) {
        return {
          id: board.id,
          name: board.name,
          base_url: board.base_url,
          post_url: board.post_url,
          selectors: board.selectors,
          enabled: board.enabled,
        };
      }
    } catch (supabaseError) {
      console.error('Supabase board fetch failed, falling back to API:', supabaseError);
    }

    const { data } = await api.get(`/api/boards/${id}`);
    return data;
  }
};

// Debounce function to prevent rate limiting
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(fn(...args));
      }, delay);
    });
  };
};

// Jobs endpoints - Hybrid approach for processing and real-time updates
export const jobs = {
  create: async (jobData: CreateJobRequest) => {
    // Use backend API for job creation (handles payment, queue, etc.)
    const { data } = await api.post('/api/jobs', jobData);

    // Also create in Supabase for real-time tracking
    try {
      const apiKey = localStorage.getItem('api_key');
      if (apiKey) {
        const user = await db.users.findByApiKey(apiKey);
        if (user && user !== null) {
          await db.jobs.create({
            id: data.id,
            user_id: user.id,
            title: jobData.title,
            description: jobData.description,
            location: jobData.location,
            salary_min: jobData.salary_min,
            salary_max: jobData.salary_max,
            company: jobData.company,
            contact_email: jobData.contact_email,
            employment_type: jobData.employment_type,
            department: jobData.department,
            status: 'payment_pending',
            payment_intent_id: data.paymentIntent?.id,
            payment_status: 'pending',
          });
        }
      }
    } catch (supabaseError) {
      console.error('Supabase job creation failed:', supabaseError);
    }

    return data;
  },

  get: async (id: string): Promise<Job> => {
    // Check if ID is a valid UUID (Supabase uses UUIDs)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    try {
      // Only try Supabase if it's a UUID
      if (isUUID) {
        const apiKey = localStorage.getItem('api_key');
        if (apiKey) {
          const user = await db.users.findByApiKey(apiKey);
          if (user && user !== null) {
            const supabaseJob = await db.jobs.findById(id);
            if (supabaseJob) {
            return {
              id: supabaseJob.id,
              userId: supabaseJob.user_id,
              title: supabaseJob.title,
              description: supabaseJob.description,
              location: supabaseJob.location,
              salaryMin: supabaseJob.salary_min,
              salaryMax: supabaseJob.salary_max,
              company: supabaseJob.company,
              contactEmail: supabaseJob.contact_email,
              employmentType: supabaseJob.employment_type,
              department: supabaseJob.department,
              status: supabaseJob.status,
              createdAt: new Date(supabaseJob.created_at),
              updatedAt: supabaseJob.updated_at ? new Date(supabaseJob.updated_at) : undefined,
              };
            }
          }
        }
      }
    } catch (supabaseError) {
      console.error('Supabase job get failed:', supabaseError);
    }

    // Fallback to backend API
    const { data } = await api.get(`/api/jobs/${id}`);
    return data;
  },

  list: debounce(async (): Promise<Job[]> => {
    try {
      const apiKey = localStorage.getItem('api_key');
      if (apiKey) {
        const user = await db.users.findByApiKey(apiKey);
        if (user && user !== null) {
          const supabaseJobs = await db.jobs.listByUser(user.id);
          if (supabaseJobs && supabaseJobs.length > 0) {
            return supabaseJobs.map(job => ({
              id: job.id,
              userId: job.user_id,
              title: job.title,
              description: job.description,
              location: job.location,
              salaryMin: job.salary_min,
              salaryMax: job.salary_max,
              company: job.company,
              contactEmail: job.contact_email,
              employmentType: job.employment_type,
              department: job.department,
              status: job.status,
              createdAt: job.created_at ? new Date(job.created_at) : new Date(),
            }));
          }
        }
      }
    } catch (supabaseError) {
      console.error('Supabase jobs fetch failed, falling back to API:', supabaseError);
    }

    const { data } = await api.get('/api/jobs');
    return data;
  }, 500),

  publish: async (jobId: string, boardIds: string[]): Promise<any> => {
    const { data } = await api.post(`/api/jobs/${jobId}/publish`, { boardIds });
    return data;
  },

  getStatus: async (id: string): Promise<JobStatusResponse> => {
    // Try Supabase first for real-time status
    try {
      const job = await db.jobs.findById(id);
      const postings = await db.postings.listByJob(id);

      if (job && postings) {
        return {
          job_id: job.id,
          overall_status: job.status as any,
          postings: postings.map((p: any) => ({
            board_id: p.board_id,
            board_name: p.board?.name || 'Unknown',
            status: p.status,
            external_url: p.external_url,
            error_message: p.error_message,
          })),
        };
      }
    } catch (supabaseError) {
      console.error('Supabase status fetch failed, falling back to API:', supabaseError);
    }

    // Fallback to backend API
    const { data } = await api.get(`/api/jobs/${id}/status`);
    return data;
  },

  confirmPayment: async (id: string, paymentIntentId: string) => {
    // Use backend API for payment confirmation (Stripe integration)
    const { data } = await api.post(`/api/jobs/${id}/confirm-payment`, {
      payment_intent_id: paymentIntentId
    });

    // Update Supabase for real-time status
    try {
      await db.jobs.update(id, {
        payment_status: 'succeeded',
        status: 'pending',
      });
    } catch (supabaseError) {
      console.error('Supabase payment update failed:', supabaseError);
    }

    return data;
  },

  update: async (id: string, updates: any) => {
    // Update job via backend API
    const { data } = await api.put(`/api/jobs/${id}`, updates);

    // Also update in Supabase for real-time sync
    try {
      await db.jobs.update(id, updates);
    } catch (supabaseError) {
      console.error('Supabase job update failed:', supabaseError);
    }

    return data;
  }
};

// Export Supabase utilities for real-time features
export { supabase, db } from './supabase';
export { subscriptions } from './supabase';