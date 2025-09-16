import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  // Test timeout
  timeout: 60 * 1000, // 60 seconds per test
  
  // Global timeout
  globalTimeout: 10 * 60 * 1000, // 10 minutes total
  
  // Retry failed tests
  retries: 2,
  
  // Number of workers
  workers: 1, // Run tests sequentially for job posting
  
  // Browser options
  use: {
    // Browser to use
    browserName: 'chromium',
    
    // Launch options
    headless: process.env.NODE_ENV === 'production',
    
    // Context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Recording options for debugging
    video: process.env.NODE_ENV !== 'production' ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    
    // Navigation timeout
    navigationTimeout: 30 * 1000, // 30 seconds
    actionTimeout: 15 * 1000, // 15 seconds
  },
  
  // Output folder for test artifacts
  outputDir: './test-results/',
  
  // Reporter to use
  reporter: [
    ['list'],
    ['json', { outputFile: './test-results/report.json' }],
    ['html', { outputFolder: './test-results/html-report', open: 'never' }]
  ],
};

export default config;