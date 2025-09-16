#!/usr/bin/env node

// Test script for the complete multiposting flow with Groq LLM
const { MultiBoardJobPoster } = require('./dist/automation/multi-board-poster');
const { createLLMManager } = require('./dist/llm/llm-manager');

async function testMultiposting() {
  console.log('🧪 Starting multiposting test...');
  
  // Check if Groq API key is available
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey === 'demo-key') {
    console.error('❌ Please set GROQ_API_KEY environment variable');
    console.log('Get your key from: https://console.groq.com/keys');
    process.exit(1);
  }
  
  try {
    // Create LLM manager with Groq
    const llmManager = createLLMManager({
      provider: 'groq',
      apiKey: groqApiKey,
      model: 'llama-3.1-8b-instant',
      costLimit: 0.10 // Max 10 cents for testing
    });
    
    console.log('🤖 LLM manager created with Groq provider');
    
    // Test LLM connection first
    const connectionTest = await llmManager.testConnection();
    console.log('🔌 LLM connection test:', connectionTest);
    
    if (!connectionTest.success) {
      throw new Error(`LLM connection failed: ${connectionTest.error}`);
    }
    
    // Create multi-board poster
    const multiBoardPoster = new MultiBoardJobPoster(llmManager);
    await multiBoardPoster.initialize();
    
    console.log('🚀 Multi-board poster initialized');
    
    // Test board connectivity first
    console.log('📡 Testing board connectivity...');
    const connectivityResults = await multiBoardPoster.testBoardConnectivity();
    
    console.log('🌐 Board connectivity results:');
    connectivityResults.forEach(result => {
      const status = result.accessible ? '✅' : '❌';
      console.log(`  ${status} ${result.board}: ${result.responseTime}ms`);
    });
    
    // Sample job data for testing
    const testJobData = {
      id: `test-job-${Date.now()}`,
      title: 'Senior Software Engineer - Remote',
      description: `We are looking for an experienced Senior Software Engineer to join our remote team.
      
Key Responsibilities:
• Develop and maintain web applications using modern JavaScript frameworks
• Collaborate with cross-functional teams to define and design new features
• Write clean, maintainable, and well-documented code
• Participate in code reviews and provide constructive feedback

Requirements:
• 5+ years of experience in software development
• Strong proficiency in React, Node.js, and TypeScript
• Experience with cloud platforms (AWS, GCP, or Azure)
• Excellent communication skills and ability to work remotely

Benefits:
• Competitive salary ($120,000 - $180,000)
• Fully remote work environment
• Comprehensive health, dental, and vision insurance
• 401(k) with company matching
• Generous PTO policy`,
      location: 'Remote (US)',
      company: 'TechCorp Solutions',
      contactEmail: 'hiring@techcorp.example.com',
      salaryMin: 120000,
      salaryMax: 180000
    };
    
    console.log('📝 Test job data prepared:');
    console.log(`  Title: ${testJobData.title}`);
    console.log(`  Company: ${testJobData.company}`);
    console.log(`  Location: ${testJobData.location}`);
    
    // Test posting to just a few boards (start small)
    const testBoardIds = ['remoteok', 'startupjobs']; // Start with these two
    
    console.log(`🎯 Starting test posting to ${testBoardIds.length} boards...`);
    console.log('⚠️  This is a test - jobs may actually be posted to real boards');
    console.log('🔄 Press Ctrl+C within 5 seconds to cancel...');
    
    // Give user chance to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🚀 Proceeding with test posting...');
    
    // Execute multi-board posting
    const results = await multiBoardPoster.postJobToAllBoards(testJobData, testBoardIds);
    
    // Display results
    console.log('\n📊 MULTIPOSTING RESULTS:');
    console.log('='.repeat(50));
    console.log(`Job ID: ${results.jobId}`);
    console.log(`Overall Success: ${results.overallSuccess ? '✅' : '❌'}`);
    console.log(`Successful Postings: ${results.successfulPostings}/${results.totalBoards}`);
    console.log(`Total Cost: $${results.totalCost.toFixed(4)}`);
    console.log(`Total Time: ${results.totalTime}ms`);
    console.log('');
    
    // Individual board results
    console.log('📋 Board-by-Board Results:');
    results.results.forEach(result => {
      const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
      console.log(`\n${status} - ${result.boardName}`);
      console.log(`  Time: ${result.postingTime}ms`);
      if (result.cost) console.log(`  LLM Cost: $${result.cost.toFixed(4)}`);
      if (result.externalUrl) console.log(`  URL: ${result.externalUrl}`);
      if (result.error) console.log(`  Error: ${result.error}`);
      if (result.llmAnalysis) {
        console.log(`  LLM Confidence: ${result.llmAnalysis.confidence || 'N/A'}`);
      }
    });
    
    // Success summary
    if (results.overallSuccess) {
      console.log(`\n🎉 Test completed successfully! Posted to ${results.successfulPostings} boards.`);
      if (results.successfulPostings > 0) {
        console.log('📌 Job postings may be live on the following boards:');
        results.results
          .filter(r => r.success)
          .forEach(r => console.log(`  • ${r.boardName}: ${r.externalUrl}`));
      }
    } else {
      console.log('\n⚠️  Test completed but no successful postings.');
      console.log('This could be due to:');
      console.log('• Form structure changes on target sites');
      console.log('• Network connectivity issues');
      console.log('• Bot detection measures');
      console.log('• Required authentication not handled');
    }
    
    // Cleanup
    await multiBoardPoster.cleanup();
    console.log('\n🧹 Cleanup completed');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test cancelled by user');
  process.exit(0);
});

if (require.main === module) {
  testMultiposting();
}

module.exports = { testMultiposting };