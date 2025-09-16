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
      // Harvard's job board might not require login for posting
      // Check if we're already logged in or if login is required
      const loginRequired = await this.waitForElement(page, this.selectors.login.username, 5000);
      
      if (!loginRequired) {
        console.log('✅ No login required for Harvard job board');
        return true;
      }

      // Perform login if required
      await this.safeFill(page, this.selectors.login.username, credentials.username);
      await this.safeFill(page, this.selectors.login.password, credentials.password);
      await this.safeClick(page, this.selectors.login.submitButton);

      // Wait for login to complete
      await page.waitForTimeout(3000);

      // Check if login was successful
      const loginError = await page.$('.login-error');
      if (loginError) {
        const errorText = await loginError.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }

      return true;
    } catch (error: any) {
      console.error('Harvard login error:', error);
      return false;
    }
  }

  async fillJobForm(page: Page, jobData: JobData): Promise<void> {
    // Click on "Post a Job" or similar button if needed
    const postJobButtonExists = await this.waitForElement(page, this.selectors.postJobButton, 5000);
    if (postJobButtonExists) {
      await this.safeClick(page, this.selectors.postJobButton);
      await page.waitForTimeout(2000);
    }

    // Fill in the job details
    await this.safeFill(page, this.selectors.jobForm.title, jobData.title);
    await this.safeFill(page, this.selectors.jobForm.description, this.formatDescription(jobData));
    await this.safeFill(page, this.selectors.jobForm.location, jobData.location);

    // Fill optional fields if they exist
    if (jobData.department && this.selectors.jobForm.department) {
      await this.safeFill(page, this.selectors.jobForm.department, jobData.department);
    }

    if (jobData.salaryMin && this.selectors.jobForm.salaryMin) {
      await this.safeFill(page, this.selectors.jobForm.salaryMin, jobData.salaryMin.toString());
    }

    if (jobData.salaryMax && this.selectors.jobForm.salaryMax) {
      await this.safeFill(page, this.selectors.jobForm.salaryMax, jobData.salaryMax.toString());
    }

    if (jobData.employmentType && this.selectors.jobForm.employmentType) {
      // Try to select from dropdown if it's a select element
      const isSelect = await page.$eval(this.selectors.jobForm.employmentType, el => el.tagName === 'SELECT');
      if (isSelect) {
        await page.selectOption(this.selectors.jobForm.employmentType, jobData.employmentType);
      } else {
        await this.safeFill(page, this.selectors.jobForm.employmentType, jobData.employmentType);
      }
    }

    await this.safeFill(page, this.selectors.jobForm.contactEmail, jobData.contactEmail);

    // Wait a bit to ensure all fields are properly filled
    await page.waitForTimeout(1000);
  }

  async submitJob(page: Page): Promise<PostingResult> {
    try {
      // Click submit button
      const submitClicked = await this.safeClick(page, this.selectors.submitButton);
      if (!submitClicked) {
        throw new Error('Could not find submit button');
      }

      // Wait for submission to complete
      await page.waitForTimeout(5000);

      // Check for success
      const successIndicator = await browserService.waitForSuccessIndicator(page, [
        this.selectors.successMessage,
        this.selectors.jobIdElement,
        'text=/successfully posted/i',
        'text=/submission complete/i'
      ]);

      if (successIndicator) {
        // Try to extract job URL or ID
        let externalUrl: string | undefined;
        
        // Try to get job ID from success page
        const jobIdElement = await page.$(this.selectors.jobIdElement);
        if (jobIdElement) {
          const jobId = await jobIdElement.textContent();
          if (jobId) {
            externalUrl = `https://sjobs.brassring.com/TGnewUI/Search/Home/Home?partnerid=25240&siteid=5341#jobDetails=${jobId.trim()}`;
          }
        }

        // If no job ID, try to extract from URL
        if (!externalUrl) {
          const currentUrl = page.url();
          if (currentUrl.includes('jobid=') || currentUrl.includes('posting/')) {
            externalUrl = currentUrl;
          }
        }

        return {
          success: true,
          externalUrl,
          screenshot: await page.screenshot({ fullPage: true })
        };
      }

      // Check for errors
      const errorSelectors = ['.error-message', '.alert-danger', '[role="alert"]'];
      for (const selector of errorSelectors) {
        const errorElement = await page.$(selector);
        if (errorElement) {
          const errorText = await errorElement.textContent();
          return {
            success: false,
            errorMessage: errorText || 'Submission failed',
            screenshot: await page.screenshot({ fullPage: true })
          };
        }
      }

      // No clear success or error indicator
      return {
        success: false,
        errorMessage: 'Submission status unclear - manual verification required',
        screenshot: await page.screenshot({ fullPage: true })
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || 'Failed to submit job',
        screenshot: await page.screenshot({ fullPage: true }).catch(() => undefined)
      };
    }
  }
}