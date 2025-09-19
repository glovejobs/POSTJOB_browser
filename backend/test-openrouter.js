require('dotenv').config();

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not found in environment');
    return;
  }

  console.log('Testing OpenRouter API directly...\n');
  console.log('API Key configured:', apiKey.substring(0, 10) + '...');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'PostJob Test'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'user',
            content: 'Write a brief job description for a Software Engineer position. Keep it under 100 words.'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ OpenRouter Response:\n');
    console.log(data.choices[0]?.message?.content || 'No content');

    console.log('\n✅ OpenRouter API is working correctly!');

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Test streaming
async function testStreaming() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  console.log('\n\nTesting OpenRouter Streaming...\n');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'PostJob Test'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'user',
            content: 'Count from 1 to 10 slowly.'
          }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Streaming Error:', error);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('Streaming response:');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('\n\n✅ Streaming completed!');
            return;
          }

          try {
            const chunk = JSON.parse(data);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              process.stdout.write(content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Streaming failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testOpenRouter();
  await testStreaming();
}

runTests();