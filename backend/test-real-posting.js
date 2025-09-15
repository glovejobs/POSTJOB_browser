const { RealJobPoster } = require('./src/automation/real-job-poster.ts');

// Test job data
const testJob = {
  title: 'Senior Software Engineer',
  description: 'We are looking for a talented Senior Software Engineer to join our team. You will be responsible for developing scalable web applications, collaborating with cross-functional teams, and mentoring junior developers. Required skills include JavaScript, React, Node.js, and experience with cloud platforms.',
  location: 'San Francisco, CA',
  company: 'Tech Innovations Inc',
  contactEmail: 'jobs@techinnovations.com',
  salaryMin: 120000,
  salaryMax: 180000
};

// Real job boards to test (starting with smaller, less protected sites)
const testBoards = [
  {
    name: 'AngelList (Wellfound)',
    postUrl: 'https://angel.co/company/jobs/new'
  },
  {
    name: 'RemoteOK',
    postUrl: 'https://remoteok.io/remote-job-form'
  },
  {
    name: 'Startup Jobs',
    postUrl: 'https://startup.jobs/post-a-job'
  }
];

async function testRealJobPosting() {
  const poster = new RealJobPoster();
  
  console.log('🚀 Starting real job posting test...\n');
  
  for (const board of testBoards) {
    console.log(`📋 Testing: ${board.name}`);
    console.log(`🔗 URL: ${board.postUrl}`);
    
    try {
      const result = await poster.postToBoard(board, testJob);
      
      if (result.success) {
        console.log(`✅ SUCCESS on ${board.name}`);
        console.log(`📍 External URL: ${result.externalUrl}`);
        if (result.boardResponse) {
          console.log(`📄 Response:`, result.boardResponse);
        }
      } else {
        console.log(`❌ FAILED on ${board.name}`);
        console.log(`❗ Error: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`💥 CRASH on ${board.name}: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Wait between attempts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await poster.cleanup();
  console.log('🏁 Test completed!');
}

// Run the test
testRealJobPosting().catch(console.error);