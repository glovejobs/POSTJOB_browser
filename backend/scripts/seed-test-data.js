const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Seeding test data...\n');

  try {
    // 1. Create or get test user
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('Creating test user...');
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          apiKey: 'test-key-' + crypto.randomBytes(16).toString('hex')
        }
      });
      console.log('✅ User created');
    } else {
      console.log('✅ User exists');
    }
    console.log('   User ID:', user.id);
    console.log('   API Key:', user.apiKey.substring(0, 20) + '...\n');

    // 2. Create test job
    console.log('Creating test job...');
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        title: 'Senior Software Engineer',
        description: 'We are looking for an experienced software engineer to join our team. This role offers exciting challenges and growth opportunities.',
        location: 'San Francisco, CA',
        company: 'Tech Corp',
        contactEmail: 'jobs@techcorp.com',
        salaryMin: 120000,
        salaryMax: 180000,
        employmentType: 'full-time',
        department: 'Engineering',
        status: 'draft'
      }
    });
    console.log('✅ Job created');
    console.log('   Job ID:', job.id);
    console.log('   Title:', job.title);
    console.log('   Status:', job.status, '\n');

    // 3. List all jobs
    console.log('Listing all jobs:');
    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    });

    jobs.forEach((j, index) => {
      console.log(`   ${index + 1}. [${j.id}] ${j.title} (${j.status})`);
    });

    console.log('\n================================');
    console.log('✅ Test data seeded successfully!');
    console.log('You can now access the job at:');
    console.log(`   http://localhost:3002/job/${job.id}`);
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();