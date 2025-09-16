// Shared types between frontend and backend

export interface User {
  id: string;
  email: string;
  api_key: string;
  created_at: Date;
}

export interface JobBoard {
  id: string;
  name: string;
  base_url: string;
  post_url: string;
  selectors: {
    title: string;
    description: string;
    location: string;
    submit: string;
  };
  enabled: boolean;
}

export interface Job {
  id: string;
  userId: string;
  title: string;
  description: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  company: string;
  contactEmail: string;
  employmentType?: string;
  department?: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt?: Date;
  postings?: JobPosting[];
}

export interface JobPosting {
  id: string;
  job_id: string;
  board_id: string;
  status: PostingStatus;
  external_url?: string;
  error_message?: string;
  posted_at?: Date;
  created_at: Date;
}

export type JobStatus = 'draft' | 'pending' | 'posting' | 'completed' | 'failed' | 'payment_pending';
export type PostingStatus = 'pending' | 'posting' | 'success' | 'failed';

// API Request/Response types
export interface CreateJobRequest {
  title: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  company: string;
  contact_email: string;
  employment_type?: string;
  department?: string;
  selected_boards?: string[]; // Board IDs to post to
}

export interface JobStatusResponse {
  job_id: string;
  overall_status: JobStatus;
  postings: Array<{
    board_id: string;
    board_name: string;
    status: PostingStatus;
    external_url?: string;
    error_message?: string;
  }>;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

// WebSocket events
export interface JobStatusUpdate {
  job_id: string;
  board_id: string;
  board_name: string;
  status: PostingStatus;
  external_url?: string;
  error_message?: string;
}