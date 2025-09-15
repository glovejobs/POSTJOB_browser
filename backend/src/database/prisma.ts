// Mock Prisma Client for testing when real client can't be generated
const mockPrismaClient = {
  user: {
    findUnique: async (_query?: any) => ({ id: '1', email: 'test@example.com', apiKey: 'test-key', createdAt: new Date() }),
    create: async (data: any) => ({ id: '1', ...data.data, createdAt: new Date() })
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
  job: {
    create: async (data: any) => ({ id: '1', ...data.data, createdAt: new Date() }),
    findUnique: async (_query?: any) => ({ 
      id: '1', 
      title: 'Test Job', 
      status: 'pending', 
      postings: [] 
    }),
    findFirst: async (_query?: any) => ({ 
      id: '1', 
      title: 'Test Job', 
      status: 'pending', 
      postings: [] 
    }),
    findMany: async (_query?: any) => [{ id: '1', title: 'Test Job', status: 'pending', _count: { postings: 5 } }],
    update: async (_query?: any) => ({ id: '1', title: 'Test Job', status: 'posting' })
  },
  jobPosting: {
    createMany: async (_data?: any) => ({ count: 5 }),
    findMany: async (_query?: any) => [],
    update: async (_query?: any) => ({ id: '1', status: 'success' })
  }
};

export default mockPrismaClient;