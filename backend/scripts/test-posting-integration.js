import { postingService } from '../dist/services/posting.service.js';

// Test job data
const testJobData = {
  title: 'Senior Software Engineer',
  description: `We are seeking a talented Senior Software Engineer to join our team.

Responsibilities:
- Design and develop scalable web applications
- Collaborate with cross-functional teams
- Mentor junior developers
- Participate in code reviews

Requirements:
- 5+ years of software development experience
- Strong knowledge of TypeScript and Node.js
- Experience with React and modern frontend frameworks
- Excellent problem-solving skills`,
  location: 'Boston, MA',
  company: 'Tech Innovations Inc.',
  salaryMin: 120000,
  salaryMax: 180000,
  employmentType: 'full-time',
  department: 'Engineering',
  contactEmail: 'careers@techinnovations.com'
};

// Test credentials (would be encrypted in production)
const testCredentials = {
  email: 'test@techinnovations.com',
  password: 'test123',
  company: 'Tech Innovations Inc.'
};

async function testSingleBoard() {
  console.log('\n🧪 Testing single board posting...\n');
  
  try {
    const result = await postingService.postToBoard(
      'harvard',
      testJobData,
      testCredentials
    );
    
    console.log('\n📊 Result:');
    console.log(`Board: ${result.boardName}`);
    console.log(`Success: ${result.success}`);
    console.log(`URL: ${result.externalUrl || 'N/A'}`);
    console.log(`Error: ${result.errorMessage || 'None'}`);
    
    if (result.screenshot) {
      console.log(`Screenshot captured: ${result.screenshot.length} bytes`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testMultipleBoards() {
  console.log('\n🧪 Testing multiple board posting...\n');
  
  const boards = ['harvard', 'mit', 'stanford'];
  
  try {
    const results = await postingService.postToMultipleBoards(
      boards,
      testJobData,
      testCredentials
    );
    
    console.log('\n📊 Results Summary:');
    results.forEach(result => {
      console.log(`\n${result.boardName}:`);
      console.log(`  Success: ${result.success}`);
      console.log(`  URL: ${result.externalUrl || 'N/A'}`);
      console.log(`  Error: ${result.errorMessage || 'None'}`);
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ Success rate: ${successCount}/${results.length}`);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Playwright posting integration tests...\n');
  
  // Test single board
  await testSingleBoard();
  
  // Wait a bit before testing multiple boards
  console.log('\n⏳ Waiting 5 seconds before next test...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test multiple boards
  await testMultipleBoards();
  
  // Clean up
  await postingService.close();
  console.log('\n✨ Tests completed!\n');
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});