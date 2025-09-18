import { Page } from 'playwright';
import { BasePostingStrategy } from './base.strategy';
import { JobData, PostingResult, browserService } from '../browser.service';

export class HarvardPostingStrategy extends BasePostingStrategy {
  constructor() {
    super(
      'Harvard University',
      'https://sjobs.brassring.com/TGnewUI/Search/Home/Home?partnerid=25240&siteid=5341',
      'https://sjobs.brassring.com/TGnewUI/Search/Home/Home?partnerid=25240&siteid=5341#submitCareer',
      {
        // Login selectors (if required)
        login: {
          username: '#username',
          password: '#password',
          submitButton: '#loginButton'
        },
        // Job form selectors
        jobForm: {
          title: '#jobTitle',
          description: '#jobDescription',
          location: '#jobLocation',
          department: '#department',
          salaryMin: '#salaryRangeMin',
          salaryMax: '#salaryRangeMax',
          employmentType: '#employmentType',
          contactEmail: '#contactEmail'
        },
        // Navigation and submission
        postJobButton: 'a[href*="submitCareer"]',
        submitButton: '#submitJobButton',
        // Success indicators
        successMessage: '.submission-success',
        jobIdElement: '.job-reference-number'
      }
    );
  }

  async login(page: Page, credentials: any): Promise<boolean> {
    try {
      console.log('🔐 Navigating to Harvard careers portal...');
      await page.goto(this.loginUrl, { waitUntil: 'networkidle' });
      await browserService.debugPage(page, 'Harvard Login Page');

      // Harvard's job board might not require login for posting
      // Check if we're already logged in or if login is required
      const loginRequired = await this.waitForElement(page, this.selectors.login.username, 5000);

      if (!loginRequired) {
        console.log('✅ No login required for Harvard job board');
        return true;
      }

      console.log('🔑 Login required - entering credentials...');
      // Perform login if required
      await this.safeFill(page, this.selectors.login.username, credentials.username);
      await this.safeFill(page, this.selectors.login.password, credentials.password);
      await this.safeClick(page, this.selectors.login.submitButton);

      // Wait for login to complete
      console.log('⏳ Waiting for login to complete...');
      await page.waitForTimeout(3000);

      // Check if login was successful
      const loginError = await page.$('.login-error');
      if (loginError) {
        const errorText = await loginError.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }

      console.log('✅ Login successful');
      return true;
    } catch (error: any) {
      console.error('❌ Harvard login error:', error);
      await browserService.debugPage(page, 'Harvard Login Error');
      return false;
    }
  }

  async fillJobForm(page: Page, jobData: JobData): Promise<void> {
    try {
      console.log('📝 Starting form fill process...');
      await browserService.debugPage(page, 'Harvard Job Form');

      // Click on "Post a Job" or similar button if needed
      const postJobButtonExists = await this.waitForElement(page, this.selectors.postJobButton, 5000);
      if (postJobButtonExists) {
        console.log('🔗 Clicking "Post Job" button...');
        await this.safeClick(page, this.selectors.postJobButton);
        await page.waitForTimeout(2000);
      }

      console.log('✏️ Filling required fields...');
      console.log(`  📋 Title: ${jobData.title}`);
      await this.safeFill(page, this.selectors.jobForm.title, jobData.title);

      console.log(`  📄 Description: ${jobData.description.substring(0, 100)}...`);
      await this.safeFill(page, this.selectors.jobForm.description, this.formatDescription(jobData));

      console.log(`  📍 Location: ${jobData.location}`);
      await this.safeFill(page, this.selectors.jobForm.location, jobData.location);

      // Fill optional fields if they exist
      if (jobData.department && this.selectors.jobForm.department) {
        console.log(`  🏢 Department: ${jobData.department}`);
        await this.safeFill(page, this.selectors.jobForm.department, jobData.department);
      }

      if (jobData.salaryMin && this.selectors.jobForm.salaryMin) {
        console.log(`  💰 Salary Min: $${jobData.salaryMin}`);
        await this.safeFill(page, this.selectors.jobForm.salaryMin, jobData.salaryMin.toString());
      }

      if (jobData.salaryMax && this.selectors.jobForm.salaryMax) {
        console.log(`  💰 Salary Max: $${jobData.salaryMax}`);
        await this.safeFill(page, this.selectors.jobForm.salaryMax, jobData.salaryMax.toString());
      }

      if (jobData.employmentType && this.selectors.jobForm.employmentType) {
        console.log(`  👔 Employment Type: ${jobData.employmentType}`);
        // Try to select from dropdown if it's a select element
        try {
          const isSelect = await page.$eval(this.selectors.jobForm.employmentType, el => el.tagName === 'SELECT');
          if (isSelect) {
            await page.selectOption(this.selectors.jobForm.employmentType, jobData.employmentType);
          } else {
            await this.safeFill(page, this.selectors.jobForm.employmentType, jobData.employmentType);
          }
        } catch (error) {
          console.log(`  ⚠️ Could not set employment type: ${error}`);
        }
      }

      console.log(`  📧 Contact Email: ${jobData.contactEmail}`);
      await this.safeFill(page, this.selectors.jobForm.contactEmail, jobData.contactEmail);

      console.log('✅ Form filled successfully');
      // Wait a bit to ensure all fields are properly filled
      await page.waitForTimeout(1000);
      await browserService.debugPage(page, 'Harvard Form Filled');
    } catch (error) {
      console.error('❌ Error filling form:', error);
      await browserService.debugPage(page, 'Harvard Form Fill Error');
      throw error;
    }
  }

  async submitJob(page: Page): Promise<PostingResult> {
    try {
      console.log('🚀 Submitting job posting...');
      await browserService.debugPage(page, 'Harvard Pre-Submit');

      // Click submit button
      const submitClicked = await this.safeClick(page, this.selectors.submitButton);
      if (!submitClicked) {
        console.log('❌ Could not find submit button');
        throw new Error('Could not find submit button');
      }

      console.log('⏳ Waiting for submission to complete...');
      // Wait for submission to complete and navigation
      await page.waitForTimeout(5000);

      console.log(`📍 Current URL after submit: ${page.url()}`);
      await browserService.debugPage(page, 'Harvard Post-Submit');

      // Check for success indicators
      console.log('🔍 Looking for success indicators...');
      const successIndicator = await browserService.waitForSuccessIndicator(page, [
        this.selectors.successMessage,
        this.selectors.jobIdElement,
        'text=/successfully posted/i',
        'text=/submission complete/i',
        'text=/thank you/i',
        'text=/confirmation/i'
      ]);

      if (successIndicator) {
        console.log(`✅ Success indicator found: ${successIndicator}`);

        // Try to extract job URL or ID
        let externalUrl: string | undefined;

        // Method 1: Try to get job ID from success page
        const jobIdElement = await page.$(this.selectors.jobIdElement);
        if (jobIdElement) {
          const jobId = await jobIdElement.textContent();
          if (jobId) {
            const cleanJobId = jobId.trim().replace(/[^\w-]/g, '');
            externalUrl = `https://sjobs.brassring.com/TGnewUI/Search/Home/Home?partnerid=25240&siteid=5341#jobDetails=${cleanJobId}`;
            console.log(`📋 Job ID found: ${cleanJobId}`);
            console.log(`🔗 Generated URL: ${externalUrl}`);
          }
        }

        // Method 2: Extract from current URL
        if (!externalUrl) {
          const currentUrl = page.url();
          console.log(`🔍 Checking current URL for job info: ${currentUrl}`);

          if (currentUrl.includes('jobid=') || currentUrl.includes('posting/') || currentUrl.includes('confirmation')) {
            externalUrl = currentUrl;
            console.log(`🔗 Using current URL as external URL`);
          }
        }

        // Method 3: Try to find any links that look like job URLs
        if (!externalUrl) {
          console.log('🔍 Searching for job links on page...');
          try {
            const jobLinks = await page.$$eval('a[href*="job"], a[href*="posting"], a[href*="position"]',
              links => links.map(link => (link as any).href).filter(href => href && (href.includes('job') || href.includes('position')))
            );

            if (jobLinks.length > 0) {
              externalUrl = jobLinks[0];
              console.log(`🔗 Found job link: ${externalUrl}`);
            }
          } catch (error) {
            console.log(`⚠️ Could not search for job links: ${error}`);
          }
        }

        const result = {
          success: true,
          externalUrl,
          screenshot: await page.screenshot({ fullPage: true })
        };

        console.log(`✅ Job posted successfully${externalUrl ? ` - URL: ${externalUrl}` : ''}`);
        return result;
      }

      // Check for errors
      console.log('🔍 Looking for error messages...');
      const errorSelectors = ['.error-message', '.alert-danger', '[role="alert"]', '.error', '.warning'];
      for (const selector of errorSelectors) {
        const errorElement = await page.$(selector);
        if (errorElement) {
          const errorText = await errorElement.textContent();
          console.log(`❌ Error found: ${errorText}`);
          return {
            success: false,
            errorMessage: errorText || 'Submission failed',
            screenshot: await page.screenshot({ fullPage: true })
          };
        }
      }

      // No clear success or error indicator
      console.log('⚠️ No clear success/error indicator found');
      const finalUrl = page.url();
      const urlChanged = !finalUrl.includes(this.postUrl);

      return {
        success: urlChanged, // Assume success if URL changed
        externalUrl: urlChanged ? finalUrl : undefined,
        errorMessage: urlChanged ? undefined : 'Submission status unclear - manual verification required',
        screenshot: await page.screenshot({ fullPage: true })
      };
    } catch (error: any) {
      console.error(`❌ Submit error: ${error.message}`);
      await browserService.debugPage(page, 'Harvard Submit Error');

      return {
        success: false,
        errorMessage: error.message || 'Failed to submit job',
        screenshot: await page.screenshot({ fullPage: true }).catch(() => undefined)
      };
    }
  }
}