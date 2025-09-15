import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const jobBoards = [
  {
    name: 'Harvard University Careers',
    baseUrl: 'https://harvard.edu/careers',
    postUrl: 'https://harvard.edu/careers/post-position',
    selectors: {
      title: '#position-title',
      description: '#position-description',
      location: '#work-location',
      submit: '#submit-position'
    }
  },
  {
    name: 'MIT Careers',
    baseUrl: 'https://careers.mit.edu',
    postUrl: 'https://careers.mit.edu/post-job',
    selectors: {
      title: "[name='job_title']",
      description: "[name='job_description']",
      location: "[name='location']",
      submit: '.submit-btn'
    }
  },
  {
    name: 'Stanford Jobs',
    baseUrl: 'https://jobs.stanford.edu',
    postUrl: 'https://jobs.stanford.edu/post',
    selectors: {
      title: '#jobTitle',
      description: '#jobDescription',
      location: '#jobLocation',
      submit: "[type='submit']"
    }
  },
  {
    name: 'UC Berkeley Careers',
    baseUrl: 'https://careers.berkeley.edu',
    postUrl: 'https://careers.berkeley.edu/employers/post-job',
    selectors: {
      title: '#title',
      description: '#description',
      location: '#location',
      submit: '#post-job-btn'
    }
  },
  {
    name: 'NYU Careers',
    baseUrl: 'https://nyu.edu/careers',
    postUrl: 'https://nyu.edu/careers/employers/post-position',
    selectors: {
      title: "[data-field='title']",
      description: "[data-field='description']",
      location: "[data-field='location']",
      submit: "[data-action='submit']"
    }
  }
];

async function main() {
  console.log('Seeding database...');
  
  // Clear existing job boards
  await prisma.jobBoard.deleteMany();
  
  // Seed job boards
  for (const board of jobBoards) {
    await prisma.jobBoard.create({
      data: board
    });
  }
  
  console.log('✓ Seeded job boards');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });