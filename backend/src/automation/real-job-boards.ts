// Extended JobBoard interface for real job boards with additional properties
interface ExtendedJobBoard {
  id: string;
  name: string;
  baseUrl: string;
  postUrl: string;
  post_url: string; // For compatibility
  selectors: {
    title: string;
    description: string;
    location: string;
    submit: string;
    company?: string;
    email?: string;
    salary?: string;
  };
  enabled: boolean;
  requiresAuth: boolean;
  pricing: string;
  category: string;
}

// Real job boards with accessible posting forms
export const REAL_JOB_BOARDS: ExtendedJobBoard[] = [
  {
    id: 'remoteok',
    name: 'RemoteOK',
    baseUrl: 'https://remoteok.io',
    postUrl: 'https://remoteok.io/jobs/post',
    post_url: 'https://remoteok.io/jobs/post',
    selectors: {
      title: '[name="job_title"]',
      description: '[name="job_description"]',
      location: '[name="location"]',
      company: '[name="company"]',
      email: '[name="email"]',
      submit: 'input[type="submit"]'
    },
    enabled: true,
    requiresAuth: false,
    pricing: 'free',
    category: 'remote'
  },
  {
    id: 'wellfound',
    name: 'Wellfound (AngelList)',
    baseUrl: 'https://wellfound.com',
    postUrl: 'https://wellfound.com/jobs/new',
    post_url: 'https://wellfound.com/jobs/new',
    selectors: {
      title: '[data-test="job-title-input"]',
      description: '[data-test="job-description"]',
      location: '[data-test="location-input"]',
      company: '[data-test="company-input"]',
      submit: '[data-test="submit-button"]'
    },
    enabled: true,
    requiresAuth: true,
    pricing: 'paid',
    category: 'startup'
  },
  {
    id: 'weworkremotely',
    name: 'We Work Remotely',
    baseUrl: 'https://weworkremotely.com',
    postUrl: 'https://weworkremotely.com/remote-jobs/new',
    post_url: 'https://weworkremotely.com/remote-jobs/new',
    selectors: {
      title: '#job_title',
      description: '#job_description',
      location: '#job_location',
      company: '#job_company',
      submit: 'input[name="commit"]'
    },
    enabled: true,
    requiresAuth: false,
    pricing: 'paid',
    category: 'remote'
  },
  {
    id: 'ycombinator',
    name: 'Y Combinator Work List',
    baseUrl: 'https://www.worklist.fyi',
    postUrl: 'https://www.worklist.fyi/jobs/new',
    post_url: 'https://www.worklist.fyi/jobs/new',
    selectors: {
      title: '[name="title"]',
      description: '[name="description"]',
      location: '[name="location"]',
      company: '[name="company"]',
      submit: 'button[type="submit"]'
    },
    enabled: true,
    requiresAuth: true,
    pricing: 'free',
    category: 'startup'
  },
  {
    id: 'startupjobs',
    name: 'Startup Jobs',
    baseUrl: 'https://startup.jobs',
    postUrl: 'https://startup.jobs/post-a-job',
    post_url: 'https://startup.jobs/post-a-job',
    selectors: {
      title: '#job-title',
      description: '#job-description',
      location: '#location',
      company: '#company-name',
      email: '#contact-email',
      submit: '.submit-job'
    },
    enabled: true,
    requiresAuth: false,
    pricing: 'paid',
    category: 'startup'
  },
  {
    id: 'flexjobs',
    name: 'FlexJobs',
    baseUrl: 'https://www.flexjobs.com',
    postUrl: 'https://www.flexjobs.com/employers/post-job',
    post_url: 'https://www.flexjobs.com/employers/post-job',
    selectors: {
      title: '[name="jobTitle"]',
      description: '[name="jobDescription"]',
      location: '[name="location"]',
      company: '[name="companyName"]',
      submit: 'button[type="submit"]'
    },
    enabled: true,
    requiresAuth: true,
    pricing: 'paid',
    category: 'flexible'
  },
  {
    id: 'remote_co',
    name: 'Remote.co',
    baseUrl: 'https://remote.co',
    postUrl: 'https://remote.co/submit-job',
    post_url: 'https://remote.co/submit-job',
    selectors: {
      title: '[name="job_title"]',
      description: '[name="job_description"]',
      location: '[name="location"]',
      company: '[name="company"]',
      submit: 'input[value="Submit Job"]'
    },
    enabled: true,
    requiresAuth: false,
    pricing: 'paid',
    category: 'remote'
  },
  {
    id: 'nodesk',
    name: 'NoDesk',
    baseUrl: 'https://nodesk.co',
    postUrl: 'https://nodesk.co/remote-jobs/post',
    post_url: 'https://nodesk.co/remote-jobs/post',
    selectors: {
      title: '#title',
      description: '#description',
      location: '#location',
      company: '#company',
      submit: '.btn-submit'
    },
    enabled: true,
    requiresAuth: false,
    pricing: 'paid',
    category: 'remote'
  }
];

export const JOB_BOARD_CATEGORIES = {
  remote: 'Remote Work',
  startup: 'Startup Jobs',
  flexible: 'Flexible Work',
  tech: 'Technology',
  university: 'University Careers'
};

export function getJobBoardsByCategory(category: string): ExtendedJobBoard[] {
  return REAL_JOB_BOARDS.filter(board => board.category === category);
}

export function getEnabledJobBoards(): ExtendedJobBoard[] {
  return REAL_JOB_BOARDS.filter(board => board.enabled);
}

export function getFreeJobBoards(): ExtendedJobBoard[] {
  return REAL_JOB_BOARDS.filter(board => board.pricing === 'free');
}

export function getPaidJobBoards(): ExtendedJobBoard[] {
  return REAL_JOB_BOARDS.filter(board => board.pricing === 'paid');
}