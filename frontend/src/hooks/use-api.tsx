import { useCallback } from 'react';
import { api } from '../services/api';

interface UseApiHook {
  auth: {
    login: (email: string, password: string) => Promise<any>;
    register: (data: any) => Promise<any>;
    forgotPassword: (email: string) => Promise<any>;
    resetPassword: (token: string, password: string) => Promise<any>;
  };
  jobs: {
    list: () => Promise<any[]>;
    get: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    getStatus: (id: string) => Promise<any>;
  };
  boards: {
    list: () => Promise<any[]>;
    get: (id: string) => Promise<any>;
  };
  payment: {
    createIntent: (jobId: string) => Promise<any>;
    confirmPayment: (clientSecret: string) => Promise<any>;
  };
  users: {
    getProfile: () => Promise<any>;
    updateProfile: (data: any) => Promise<any>;
    changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<any>;
    updateEmailPreferences: (data: any) => Promise<any>;
    deleteAccount: (password: string) => Promise<any>;
    getStats: () => Promise<any>;
  };
  applications: {
    getByJob: (jobId: string) => Promise<any[]>;
    get: (id: string) => Promise<any>;
    submit: (data: any) => Promise<any>;
    updateStatus: (id: string, data: { status: string; notes?: string }) => Promise<any>;
    updateScore: (id: string, score: number) => Promise<any>;
    communicate: (id: string, data: { subject: string; message: string }) => Promise<any>;
    delete: (id: string) => Promise<any>;
    getStats: (jobId: string) => Promise<any>;
  };
}

export default function useApi(): UseApiHook {
  const apiCall = useCallback(async <T,>(url: string, method: string, data?: any): Promise<T> => {
    const options: any = { method };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return api.request<T>(url, options);
  }, []);

  const auth = {
    login: (email: string, password: string) => apiCall<any>('/auth/login', 'POST', { email, password }),
    register: (data: any) => apiCall<any>('/auth/register', 'POST', data),
    forgotPassword: (email: string) => apiCall<any>('/auth/forgot-password', 'POST', { email }),
    resetPassword: (token: string, password: string) => apiCall<any>('/auth/reset-password', 'POST', { token, password })
  };

  const jobs = {
    list: () => apiCall<any[]>('/jobs', 'GET'),
    get: (id: string) => apiCall<any>(`/jobs/${id}`, 'GET'),
    create: (data: any) => apiCall<any>('/jobs', 'POST', data),
    update: (id: string, data: any) => apiCall<any>(`/jobs/${id}`, 'PUT', data),
    delete: (id: string) => apiCall<any>(`/jobs/${id}`, 'DELETE'),
    getStatus: (id: string) => apiCall<any>(`/jobs/${id}/status`, 'GET')
  };

  const boards = {
    list: () => apiCall<any[]>('/boards', 'GET'),
    get: (id: string) => apiCall<any>(`/boards/${id}`, 'GET')
  };

  const payment = {
    createIntent: (jobId: string) => apiCall<any>('/payment/create-intent', 'POST', { jobId }),
    confirmPayment: (clientSecret: string) => apiCall<any>('/payment/confirm', 'POST', { clientSecret })
  };

  const users = {
    getProfile: () => apiCall<any>('/users/profile', 'GET'),
    updateProfile: (data: any) => apiCall<any>('/users/profile', 'PUT', data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiCall<any>('/users/password', 'PUT', data),
    updateEmailPreferences: (data: any) => apiCall<any>('/users/email-preferences', 'PUT', data),
    deleteAccount: (password: string) => apiCall<any>('/users/account', 'DELETE', { password }),
    getStats: () => apiCall<any>('/users/stats', 'GET')
  };

  const applications = {
    getByJob: (jobId: string) => apiCall<any[]>(`/applications/job/${jobId}`, 'GET'),
    get: (id: string) => apiCall<any>(`/applications/${id}`, 'GET'),
    submit: (data: any) => apiCall<any>('/applications', 'POST', data),
    updateStatus: (id: string, data: { status: string; notes?: string }) =>
      apiCall<any>(`/applications/${id}/status`, 'PUT', data),
    updateScore: (id: string, score: number) =>
      apiCall<any>(`/applications/${id}/score`, 'PUT', { score }),
    communicate: (id: string, data: { subject: string; message: string }) =>
      apiCall<any>(`/applications/${id}/communicate`, 'POST', data),
    delete: (id: string) => apiCall<any>(`/applications/${id}`, 'DELETE'),
    getStats: (jobId: string) => apiCall<any>(`/applications/stats/${jobId}`, 'GET')
  };

  return { auth, jobs, boards, payment, users, applications };
}