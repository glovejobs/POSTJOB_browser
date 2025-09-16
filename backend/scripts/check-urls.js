const { chromium } = require('playwright');

async function checkURLs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  console.log('🔍 Checking both URLs...\n');
  
  // Check backend (localhost:3001)
  try {
    const page1 = await context.newPage();
    console.log('🔗 Testing Backend: http://localhost:3001');
    
    const response1 = await page1.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 5000 
    });
    
    if (response1.ok()) {
      const content1 = await page1.content();
      const title1 = await page1.title();
      console.log(`✅ Backend Status: ${response1.status()}`);
      console.log(`📄 Backend Title: "${title1}"`);
      
      // Check if it's JSON
      try {
        const text = await page1.textContent('body');
        const json = JSON.parse(text);
        console.log(`🗂️  Backend Response:`, json);
      } catch (e) {
        console.log(`📝 Backend Content Length: ${content1.length} chars`);
      }
    } else {
      console.log(`❌ Backend Error: ${response1.status()}`);
    }
    await page1.close();
  } catch (error) {
    console.log(`❌ Backend Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Check frontend (localhost:3000)
  try {
    const page2 = await context.newPage();
    console.log('🔗 Testing Frontend: http://localhost:3000');
    
    const response2 = await page2.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    if (response2.ok()) {
      const title2 = await page2.title();
      console.log(`✅ Frontend Status: ${response2.status()}`);
      console.log(`📄 Frontend Title: "${title2}"`);
      
      // Check for key elements
      const h1 = await page2.$('h1');
      if (h1) {
        const h1Text = await h1.textContent();
        console.log(`🏷️  Main Heading: "${h1Text}"`);
      }
      
      const jobForm = await page2.$('form');
      console.log(`📋 Form Found: ${jobForm ? 'Yes' : 'No'}`);
      
      const jobBoards = await page2.$$text('text=Harvard');
      console.log(`🏫 Harvard Mentioned: ${jobBoards.length > 0 ? 'Yes' : 'No'}`);
      
      // Get first few lines of body text
      const bodyText = await page2.textContent('body');
      const firstLines = bodyText.slice(0, 200).replace(/\n/g, ' ');
      console.log(`📝 Body Preview: "${firstLines}..."`);
      
    } else {
      console.log(`❌ Frontend Error: ${response2.status()}`);
    }
    await page2.close();
  } catch (error) {
    console.log(`❌ Frontend Error: ${error.message}`);
  }
  
  await browser.close();
}

checkURLs().catch(console.error);