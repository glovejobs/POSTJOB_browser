import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class ApiService {
  private client: AxiosInstance;
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultCacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const apiKey = this.getApiKey();
        if (apiKey) {
          config.headers['x-api-key'] = apiKey;
        } else {
          // Log when API key is missing for debugging
          console.warn('API request made without API key:', config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Check if error is due to missing API key
        if (error.response?.status === 401 || error.response?.status === 403) {
          const apiKey = this.getApiKey();
          if (!apiKey) {
            console.error('API request failed: No API key found');
            // Only redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          } else if (error.config?.url?.includes('/api/auth')) {
            // Clear auth and redirect only for auth endpoints
            this.clearApiKey();
            window.location.href = '/login';
          }
        }
        // Don't logout for other errors (might be temporary API issues)
        return Promise.reject(error);
      }
    );

    // Clean up expired cache entries every minute
    setInterval(() => this.cleanupCache(), 60000);
  }

  private getApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('api_key');
    }
    return null;
  }

  private clearApiKey(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_key');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
    }
  }

  private getCacheKey(url: string, config?: AxiosRequestConfig): string {
    return `${url}:${JSON.stringify(config?.params || {})}`;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  private getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any, duration?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (duration || this.defaultCacheDuration),
    });
  }

  // Deduplicate identical requests
  private async deduplicatedRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Public methods with caching
  async get<T>(url: string, config?: AxiosRequestConfig & { cache?: boolean; cacheDuration?: number }): Promise<T> {
    const cacheKey = this.getCacheKey(url, config);

    // Check cache if enabled (default true for GET requests)
    if (config?.cache !== false) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Deduplicate identical requests
    return this.deduplicatedRequest(cacheKey, async () => {
      const response = await this.client.get<T>(url, config);

      // Cache successful responses
      if (config?.cache !== false) {
        this.setCachedData(cacheKey, response.data, config?.cacheDuration);
      }

      return response.data;
    });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // Invalidate related cache entries
    this.invalidateCache(url);

    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    this.invalidateCache(url);
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    this.invalidateCache(url);
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    this.invalidateCache(url);
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // Cache management
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Optimistic updates
  optimisticUpdate<T>(
    url: string,
    optimisticData: T,
    actualRequest: () => Promise<T>,
    rollbackFn?: (error: any) => void
  ): { data: T; promise: Promise<T> } {
    const cacheKey = this.getCacheKey(url, {});

    // Immediately update cache with optimistic data
    this.setCachedData(cacheKey, optimisticData);

    // Perform actual request
    const promise = actualRequest().catch((error) => {
      // Rollback on error
      this.cache.delete(cacheKey);
      rollbackFn?.(error);
      throw error;
    });

    return { data: optimisticData, promise };
  }

  // Batch requests
  async batchRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(requests.map(req => req()));
  }

  // Retry logic with exponential backoff and rate limit handling
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries = 3,
    backoffMs = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;

        // Handle rate limiting specifically
        if (error.response?.status === 429) {
          // Get retry-after header if available
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter
            ? parseInt(retryAfter) * 1000
            : Math.min(backoffMs * Math.pow(2, i + 1), 30000); // Cap at 30 seconds

          console.warn(`Rate limited. Waiting ${waitTime}ms before retry...`);

          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // Don't retry on other client errors (4xx except 429)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
        }

        // Wait before retrying with exponential backoff for other errors
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }

  // Polling
  poll<T>(
    requestFn: () => Promise<T>,
    intervalMs: number,
    shouldContinue: (data: T) => boolean
  ): { stop: () => void; promise: Promise<T> } {
    let stopped = false;

    const promise = new Promise<T>(async (resolve, reject) => {
      while (!stopped) {
        try {
          const data = await requestFn();
          if (!shouldContinue(data)) {
            resolve(data);
            break;
          }
        } catch (error) {
          reject(error);
          break;
        }

        await new Promise(r => setTimeout(r, intervalMs));
      }
    });

    return {
      stop: () => { stopped = true; },
      promise
    };
  }
}

// Export singleton instance
export const api = new ApiService();

// Export specific API functions for easier use
export const jobsApi = {
  getJobs: (params?: any) => api.get('/api/jobs', { params }),
  getJob: (id: string) => api.get(`/api/jobs/${id}`),
  createJob: (data: any) => api.post('/api/jobs', data),
  updateJob: (id: string, data: any) => api.put(`/api/jobs/${id}`, data),
  deleteJob: (id: string) => api.delete(`/api/jobs/${id}`),
  getJobStatus: (id: string) => api.get(`/api/jobs/${id}/status`, { cache: false }),
};

export const authApi = {
  login: (credentials: any) => api.post('/api/auth/login', credentials),
  register: (userData: any) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  refreshToken: () => api.post('/api/auth/refresh'),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/api/auth/reset-password', { token, password }),
};

export const paymentsApi = {
  createPaymentIntent: (amount: number) =>
    api.post('/api/payments/create-intent', { amount }),
  confirmPayment: (paymentIntentId: string) =>
    api.post('/api/payments/confirm', { paymentIntentId }),
  getPaymentHistory: () => api.get('/api/payments/history'),
};