import axios from 'axios';
import { CreateJobRequest, JobStatusResponse, JobBoard, Job } from '../../../shared/types';

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

// Auth endpoints
export const auth = {
  register: async (email: string) => {
    const { data } = await api.post('/api/auth/register', { email });
    return data;
  },
  
  me: async () => {
    const { data } = await api.get('/api/auth/me');
    return data;
  }
};

// Job boards endpoints
export const boards = {
  list: async (): Promise<JobBoard[]> => {
    const { data } = await api.get('/api/boards');
    return data;
  },
  
  get: async (id: string): Promise<JobBoard> => {
    const { data } = await api.get(`/api/boards/${id}`);
    return data;
  }
};

// Jobs endpoints
export const jobs = {
  create: async (jobData: CreateJobRequest) => {
    const { data } = await api.post('/api/jobs', jobData);
    return data;
  },
  
  list: async (): Promise<Job[]> => {
    const { data } = await api.get('/api/jobs');
    return data;
  },
  
  getStatus: async (id: string): Promise<JobStatusResponse> => {
    const { data } = await api.get(`/api/jobs/${id}/status`);
    return data;
  },
  
  confirmPayment: async (id: string, paymentIntentId: string) => {
    const { data } = await api.post(`/api/jobs/${id}/confirm-payment`, {
      payment_intent_id: paymentIntentId
    });
    return data;
  }
};