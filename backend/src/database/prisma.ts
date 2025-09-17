// Mock Prisma Client for testing when real client can't be generated
const mockPrismaClient = {
  user: {
    findUnique: async (_query?: any) => ({
      id: '1',
      email: 'test@example.com',
      apiKey: 'test-key',
      name: 'Test User',
      password: '$2a$10$YourHashedPasswordHere',
      company: 'Test Company',
      phone: '+1234567890',
      website: 'https://example.com',
      bio: 'Test bio',
      avatar: null,
      emailPreferences: {
        jobUpdates: true,
        weeklyDigest: true,
        marketing: false,
        applications: true
      },
      createdAt: new Date(),
      _count: {
        jobs: 5
      }
    }),
    create: async (data: any) => ({ id: '1', ...data.data, createdAt: new Date() }),
    update: async (_query?: any) => ({
      id: '1',
      email: 'test@example.com',
      name: 'Updated User',
      company: 'Updated Company',
      phone: '+1234567890',
      website: 'https://example.com',
      bio: 'Updated bio',
      emailPreferences: {
        jobUpdates: true,
        weeklyDigest: true,
        marketing: false,
        applications: true
      }
    }),
    delete: async (_query?: any) => ({ id: '1', email: 'test@example.com', apiKey: 'test-key', createdAt: new Date() })
  },
  postjob_users: {
    findUnique: async (_query?: any) => ({ id: '1', email: 'test@example.com', api_key: 'test-key', created_at: new Date(), updated_at: new Date() }),
    create: async (data: any) => ({ id: '1', ...data.data, created_at: new Date(), updated_at: new Date() })
  },
  jobBoard: {
    findMany: async (_query?: any) => [
      { id: '1', name: 'Harvard University Careers', baseUrl: 'https://harvard.edu/careers', enabled: true },
      { id: '2', name: 'MIT Careers', baseUrl: 'https://careers.mit.edu', enabled: true },
      { id: '3', name: 'Stanford Jobs', baseUrl: 'https://jobs.stanford.edu', enabled: true },
      { id: '4', name: 'UC Berkeley Careers', baseUrl: 'https://careers.berkeley.edu', enabled: true },
      { id: '5', name: 'NYU Careers', baseUrl: 'https://nyu.edu/careers', enabled: true }
    ],
    findUnique: async (_query?: any) => ({ id: '1', name: 'Test Board', baseUrl: 'https://test.com', enabled: true })
  },
  job_boards: {
    findMany: async (_query?: any) => [
      { id: '1', name: 'Harvard', base_url: 'https://harvard.edu/careers', enabled: true },
      { id: '2', name: 'MIT', base_url: 'https://careers.mit.edu', enabled: true },
      { id: '3', name: 'Stanford', base_url: 'https://jobs.stanford.edu', enabled: true }
    ],
    findUnique: async (_query?: any) => ({ id: '1', name: 'Test Board', base_url: 'https://test.com', enabled: true })
  },
  job: {
    create: async (data: any) => ({ id: '1', ...data.data, createdAt: new Date() }),
    findUnique: async (_query?: any) => ({
      id: '1',
      title: 'Test Job',
      status: 'pending',
      postings: [],
      paymentIntentId: null
    }),
    findFirst: async (_query?: any) => ({
      id: '1',
      title: 'Test Job',
      status: 'pending',
      postings: [],
      paymentIntentId: null
    }),
    findMany: async (_query?: any) => [{
      id: '1',
      title: 'Test Job',
      company: 'Test Company',
      status: 'pending',
      createdAt: new Date(),
      _count: { postings: 5 }
    }],
    update: async (_query?: any) => ({ id: '1', title: 'Test Job', status: 'posting', paymentIntentId: 'pi_test_123' }),
    groupBy: async (_query?: any) => [
      { status: 'draft', _count: 2 },
      { status: 'completed', _count: 3 },
      { status: 'pending', _count: 1 }
    ]
  },
  postjob_jobs: {
    create: async (data: any) => ({ id: '1', ...data.data, created_at: new Date(), updated_at: new Date() }),
    findUnique: async (_query?: any) => ({ 
      id: '1', 
      title: 'Test Job',
      description: 'Test Description',
      location: 'Test Location',
      company: 'Test Company',
      contact_email: 'test@company.com',
      salary_min: 50000,
      salary_max: 100000,
      employment_type: 'full-time',
      department: 'Engineering',
      status: 'pending', 
      job_postings: [{
        id: '1',
        board_id: '1',
        status: 'pending',
        job_boards: { id: '1', name: 'Harvard', enabled: true }
      }],
      postjob_users: { email: 'test@example.com' }
    }),
    findFirst: async (_query?: any) => ({ 
      id: '1', 
      title: 'Test Job',
      description: 'Test Description',
      location: 'Test Location',
      company: 'Test Company',
      contact_email: 'test@company.com',
      salary_min: 50000,
      salary_max: 100000,
      employment_type: 'full-time',
      department: 'Engineering',
      status: 'pending', 
      job_postings: [] 
    }),
    findMany: async (_query?: any) => [{ id: '1', title: 'Test Job', status: 'pending', _count: { job_postings: 5 } }],
    update: async (_query?: any) => ({ id: '1', title: 'Test Job', status: 'posting' }),
    updateMany: async (_query?: any) => ({ count: 1 })
  },
  jobPosting: {
    createMany: async (_data?: any) => ({ count: 5 }),
    findMany: async (_query?: any) => [],
    update: async (_query?: any) => ({ id: '1', status: 'success' }),
    updateMany: async (_query?: any) => ({ count: 1 }),
    deleteMany: async (_query?: any) => ({ count: 1 })
  },
  job_postings: {
    createMany: async (_data?: any) => ({ count: 5 }),
    findMany: async (_query?: any) => [{
      id: '1',
      job_id: '1',
      board_id: '1',
      status: 'pending',
      job_boards: { id: '1', name: 'Harvard', enabled: true },
      postjob_jobs: {
        id: '1',
        title: 'Test Job',
        description: 'Test Description',
        location: 'Test Location',
        company: 'Test Company',
        contact_email: 'test@company.com',
        salary_min: 50000,
        salary_max: 100000,
        employment_type: 'full-time',
        department: 'Engineering',
        postjob_users: { email: 'test@example.com' }
      }
    }],
    update: async (_query?: any) => ({ id: '1', status: 'success' }),
    updateMany: async (_query?: any) => ({ count: 1 }),
    deleteMany: async (_query?: any) => ({ count: 1 })
  }
};

export default mockPrismaClient;