require('dotenv').config();

async function testAI() {
  console.log('Testing AI endpoint...\n');

  try {
    // Check status first
    const statusResponse = await fetch('http://localhost:3001/api/ai/status');
    const status = await statusResponse.json();
    console.log('AI Status:', status);

    if (!status.available) {
      console.log('AI service is not available');
      return;
    }

    // Test generation with a simple request
    const testData = {
      title: 'Software Engineer',
      company: 'Test Company',
      location: 'Remote',
      employmentType: 'Full-time',
      tone: 'professional'
    };

    console.log('\nTesting non-streaming generation...');

    const response = await fetch('http://localhost:3001/api/ai/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Using a test API key - in production this would come from auth
        'x-api-key': 'test-key'
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Generation failed:', error);
      return;
    }

    const result = await response.json();
    console.log('\n✅ Generation successful!');
    console.log('Description preview:', result.description.substring(0, 200) + '...');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAI();