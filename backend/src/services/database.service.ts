import supabase from '../database/supabase';
import { v4 as uuidv4 } from 'uuid';

// Database service using Supabase directly
export const db = {
  // User operations
  user: {
    async findByEmail(email: string) {
      const { data, error } = await supabase
        .from('postjob_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async findByApiKey(apiKey: string) {
      const { data, error } = await supabase
        .from('postjob_users')
        .select('*')
        .eq('api_key', apiKey)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async findById(id: string) {
      const { data, error } = await supabase
        .from('postjob_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(userData: any) {
      const { data, error } = await supabase
        .from('postjob_users')
        .insert({
          id: uuidv4(),
          email: userData.email,
          api_key: userData.apiKey,
          password: userData.password || '',
          full_name: userData.name,
          company: userData.company,
          phone: userData.phone,
          website: userData.website,
          bio: userData.bio,
          avatar: userData.avatar,
          email_preferences: userData.emailPreferences,
          stripe_customer_id: userData.stripeCustomerId,
          email_verified: userData.emailVerified || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: any) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map camelCase to snake_case
      if (updates.name !== undefined) updateData.full_name = updates.name;
      if (updates.company !== undefined) updateData.company = updates.company;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.website !== undefined) updateData.website = updates.website;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
      if (updates.emailPreferences !== undefined) updateData.email_preferences = updates.emailPreferences;
      if (updates.stripeCustomerId !== undefined) updateData.stripe_customer_id = updates.stripeCustomerId;
      if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified;
      if (updates.emailVerificationToken !== undefined) updateData.email_verification_token = updates.emailVerificationToken;
      if (updates.resetPasswordToken !== undefined) updateData.reset_password_token = updates.resetPasswordToken;
      if (updates.resetPasswordExpires !== undefined) updateData.reset_password_expires = updates.resetPasswordExpires;
      if (updates.password !== undefined) updateData.password = updates.password;

      const { data, error } = await supabase
        .from('postjob_users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Job operations
  job: {
    async create(jobData: any) {
      const { data, error } = await supabase
        .from('postjob_jobs')
        .insert({
          id: uuidv4(),
          user_id: jobData.userId,
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          salary_min: jobData.salaryMin,
          salary_max: jobData.salaryMax,
          company: jobData.company,
          contact_email: jobData.contactEmail,
          employment_type: jobData.employmentType || 'full-time',
          department: jobData.department,
          status: jobData.status || 'draft',
          payment_intent_id: jobData.paymentIntentId,
          payment_status: jobData.paymentStatus || 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async findById(id: string, includePostings = false): Promise<any> {
      if (includePostings) {
        const { data: job, error: jobError } = await supabase
          .from('postjob_jobs')
          .select('*')
          .eq('id', id)
          .single();

        if (jobError && jobError.code !== 'PGRST116') throw jobError;
        if (!job) return null;

        const { data: postings, error: postingsError } = await supabase
          .from('job_postings')
          .select('*, board:job_boards(*)')
          .eq('job_id', id);

        if (postingsError) throw postingsError;

        return { ...job, postings: postings || [] };
      } else {
        const { data, error } = await supabase
          .from('postjob_jobs')
          .select('*')
          .eq('id', id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      }
    },

    async findByUser(userId: string, limit?: number) {
      let query = supabase
        .from('postjob_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Add application counts
      const jobs = data || [];
      for (const job of jobs) {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id_link', job.id);

        job.applicationCount = count || 0;
      }

      return jobs;
    },

    async update(id: string, updates: any) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map camelCase to snake_case
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.company !== undefined) updateData.company = updates.company;
      if (updates.salaryMin !== undefined) updateData.salary_min = updates.salaryMin;
      if (updates.salaryMax !== undefined) updateData.salary_max = updates.salaryMax;
      if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
      if (updates.employmentType !== undefined) updateData.employment_type = updates.employmentType;
      if (updates.department !== undefined) updateData.department = updates.department;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.paymentIntentId !== undefined) updateData.payment_intent_id = updates.paymentIntentId;
      if (updates.paymentStatus !== undefined) updateData.payment_status = updates.paymentStatus;

      const { data, error } = await supabase
        .from('postjob_jobs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async getStats(userId: string) {
      // Get total jobs
      const { count: totalJobs } = await supabase
        .from('postjob_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get active jobs
      const { count: activeJobs } = await supabase
        .from('postjob_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['posting', 'completed']);

      // Get total applications
      const { data: userJobs } = await supabase
        .from('postjob_jobs')
        .select('id')
        .eq('user_id', userId);

      let totalApplications = 0;
      if (userJobs && userJobs.length > 0) {
        const jobIds = userJobs.map(j => j.id);
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('job_id_link', jobIds);
        totalApplications = count || 0;
      }

      return {
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        totalApplications
      };
    }
  },

  // Job Board operations
  jobBoard: {
    async findAll(enabled?: boolean) {
      let query = supabase
        .from('job_boards')
        .select('*')
        .order('name');

      if (enabled !== undefined) {
        query = query.eq('enabled', enabled);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async findById(id: string) {
      const { data, error } = await supabase
        .from('job_boards')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  },

  // Job Posting operations
  jobPosting: {
    async create(postingData: any) {
      const { data, error } = await supabase
        .from('job_postings')
        .insert({
          id: uuidv4(),
          job_id: postingData.jobId,
          board_id: postingData.boardId,
          status: postingData.status || 'pending',
          external_url: postingData.externalUrl,
          error_message: postingData.errorMessage,
          posted_at: postingData.postedAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async createMany(jobId: string, boardIds: string[]) {
      const postings = boardIds.map(boardId => ({
        id: uuidv4(),
        job_id: jobId,
        board_id: boardId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('job_postings')
        .insert(postings);

      if (error) throw error;
    },

    async findByJob(jobId: string) {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*, board:job_boards(*)')
        .eq('job_id', jobId);

      if (error) throw error;
      return data || [];
    },

    async update(id: string, updates: any) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.externalUrl !== undefined) updateData.external_url = updates.externalUrl;
      if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
      if (updates.postedAt !== undefined) updateData.posted_at = updates.postedAt;

      const { data, error } = await supabase
        .from('job_postings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async deleteByJob(jobId: string) {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('job_id', jobId);

      if (error) throw error;
    }
  },

  // Application operations
  application: {
    async create(applicationData: any) {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          id: uuidv4(),
          job_id_link: applicationData.jobId,
          candidate_name: applicationData.candidateName,
          candidate_email: applicationData.candidateEmail,
          candidate_phone: applicationData.candidatePhone,
          resume_url: applicationData.resumeUrl,
          cover_letter: applicationData.coverLetter,
          portfolio: applicationData.portfolio,
          linkedin_url: applicationData.linkedIn,
          status: applicationData.status || 'new',
          score: applicationData.score,
          notes: applicationData.notes,
          applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async findByJob(jobId: string, status?: string) {
      let query = supabase
        .from('applications')
        .select('*')
        .eq('job_id_link', jobId)
        .order('applied_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async findById(id: string) {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async update(id: string, updates: any) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.score !== undefined) updateData.score = updates.score;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
};

export default db;