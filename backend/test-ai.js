const axios = require('axios');

async function testAIGeneration() {
  try {
    console.log('Testing AI Description Generation...\n');

    // First, we need to create a test user and get an API key
    const registerResponse = await axios.post('http://localhost:3001/api/auth/register', {
      email: `test-ai-${Date.now()}@example.com`,
      password: 'testPassword123',
      fullName: 'AI Test User'
    });

    const apiKey = registerResponse.data.apiKey;
    const accessToken = registerResponse.data.session?.access_token;

    console.log('✅ User created successfully\n');

    // Test AI generation
    console.log('Generating job description...\n');

    const jobParams = {
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      department: 'Engineering',
      salaryMin: 150000,
      salaryMax: 200000,
      requirements: [
        '5+ years of experience in software development',
        'Proficiency in JavaScript/TypeScript',
        'Experience with React and Node.js'
      ],
      responsibilities: [
        'Design and develop scalable web applications',
        'Lead code reviews and mentor junior developers',
        'Collaborate with product and design teams'
      ],
      benefits: [
        'Competitive salary and equity',
        'Health, dental, and vision insurance',
        'Flexible work arrangements'
      ],
      tone: 'professional'
    };

    const response = await axios.post(
      'http://localhost:3001/api/ai/generate-description',
      jobParams,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': apiKey
        }
      }
    );

    console.log('✅ Job Description Generated:\n');
    console.log('=' .repeat(50));
    console.log(response.data.description);
    console.log('=' .repeat(50));
    console.log('\n✅ AI Integration Test Successful!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test streaming
async function testAIStreaming() {
  try {
    console.log('\n\nTesting AI Streaming...\n');

    // Use the same test credentials
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test-ai@example.com',
      password: 'testPassword123'
    }).catch(() => null);

    if (!loginResponse) {
      console.log('Creating new test user for streaming...');
      const registerResponse = await axios.post('http://localhost:3001/api/auth/register', {
        email: 'test-ai@example.com',
        password: 'testPassword123',
        fullName: 'AI Test User'
      });
      loginResponse = { data: registerResponse.data };
    }

    const apiKey = loginResponse.data.apiKey;
    const accessToken = loginResponse.data.session?.access_token;

    const jobParams = {
      title: 'Product Manager',
      company: 'StartupXYZ',
      location: 'New York, NY',
      tone: 'friendly'
    };

    console.log('Starting stream...\n');

    const streamResponse = await axios.post(
      'http://localhost:3001/api/ai/generate-description-stream',
      jobParams,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': apiKey
        },
        responseType: 'stream'
      }
    );

    let fullContent = '';

    streamResponse.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim()) {
            try {
              const event = JSON.parse(data);
              if (event.type === 'content') {
                process.stdout.write(event.content);
                fullContent += event.content;
              } else if (event.type === 'done') {
                console.log('\n\n✅ Streaming completed successfully!');
                console.log(`Total characters streamed: ${fullContent.length}`);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    });

    streamResponse.data.on('end', () => {
      console.log('\n\nStream ended');
    });

  } catch (error) {
    console.error('❌ Streaming test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await testAIGeneration();
  await testAIStreaming();
}

runTests();