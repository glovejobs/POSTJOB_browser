const axios = require('axios');

const API_URL = 'http://localhost:3001';
let apiKey = null;
let jobId = null;

async function testJobFlow() {
  console.log('🧪 Testing Job Creation Flow\n');
  console.log('================================\n');

  try {
    // 1. Register/Login user
    console.log('1️⃣ Registering/logging in user...');
    let authResponse;
    try {
      authResponse = await axios.post(`${API_URL}/api/auth/register`, {
        email: 'test@example.com'
      });
      console.log('✅ User registered.');
    } catch (error) {
      if (error.response?.data?.error === 'User already exists') {
        console.log('   User exists, logging in...');
        authResponse = await axios.post(`${API_URL}/api/auth/login`, {
          email: 'test@example.com'
        });
        console.log('✅ User logged in.');
      } else {
        throw error;
      }
    }
    apiKey = authResponse.data.apiKey;
    console.log('   API Key:', apiKey.substring(0, 10) + '...\n');

    // 2. Create a job (as draft)
    console.log('2️⃣ Creating job...');
    const jobData = {
      title: 'Senior Software Engineer',
      description: 'We are looking for an experienced software engineer to join our team.',
      location: 'San Francisco, CA',
      company: 'Tech Corp',
      contact_email: 'jobs@techcorp.com',
      salary_min: 120000,
      salary_max: 180000,
      employment_type: 'full-time',
      department: 'Engineering'
    };

    const jobResponse = await axios.post(
      `${API_URL}/api/jobs`,
      jobData,
      { headers: { 'x-api-key': apiKey } }
    );
    jobId = jobResponse.data.id;
    console.log('✅ Job created with ID:', jobId);
    console.log('   Status:', jobResponse.data.message, '\n');

    // 3. Get job details
    console.log('3️⃣ Fetching job details...');
    const jobDetails = await axios.get(
      `${API_URL}/api/jobs/${jobId}`,
      { headers: { 'x-api-key': apiKey } }
    );
    console.log('✅ Job details retrieved:');
    console.log('   Title:', jobDetails.data.title);
    console.log('   Status:', jobDetails.data.status);
    console.log('   Company:', jobDetails.data.company, '\n');

    // 4. Update job with selected boards
    console.log('4️⃣ Selecting job boards...');
    const boardSelection = {
      postings: [
        { board_id: 'harvard', status: 'pending' },
        { board_id: 'mit', status: 'pending' },
        { board_id: 'stanford', status: 'pending' }
      ]
    };

    const updateResponse = await axios.put(
      `${API_URL}/api/jobs/${jobId}`,
      boardSelection,
      { headers: { 'x-api-key': apiKey } }
    );
    console.log('✅ Boards selected. Job status:', updateResponse.data.status);
    console.log('   Number of boards:', updateResponse.data.postings ? updateResponse.data.postings.length : 0, '\n');

    // 5. Get payment intent
    console.log('5️⃣ Getting payment intent...');
    const paymentResponse = await axios.get(
      `${API_URL}/api/jobs/${jobId}/payment-intent`,
      { headers: { 'x-api-key': apiKey } }
    );
    console.log('✅ Payment intent created:');
    console.log('   Intent ID:', paymentResponse.data.paymentIntent.id);
    console.log('   Status: Ready for payment\n');

    // 6. Confirm payment (mock)
    console.log('6️⃣ Confirming payment (mock)...');
    const confirmResponse = await axios.post(
      `${API_URL}/api/jobs/${jobId}/confirm-payment`,
      { payment_intent_id: paymentResponse.data.paymentIntent.id },
      { headers: { 'x-api-key': apiKey } }
    );
    console.log('✅ Payment confirmed!');
    console.log('   Message:', confirmResponse.data.message, '\n');

    // 7. Check job status
    console.log('7️⃣ Checking final job status...');
    const statusResponse = await axios.get(
      `${API_URL}/api/jobs/${jobId}/status`,
      { headers: { 'x-api-key': apiKey } }
    );
    console.log('✅ Job status:');
    console.log('   Overall status:', statusResponse.data.overall_status);
    console.log('   Postings:', statusResponse.data.postings.length, 'boards\n');

    console.log('================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('Job creation flow is working correctly.');
    console.log('================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.response?.data || error.message);
    console.error('\nDetails:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
testJobFlow();