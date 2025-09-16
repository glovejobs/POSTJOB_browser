import { Page } from 'playwright';
import { BasePostingStrategy } from './base.strategy';
import { JobData, PostingResult, browserService } from '../browser.service';

export class PrincetonPostingStrategy extends BasePostingStrategy {
  constructor() {
    super(
      'Princeton University',
      'https://careerdevelopment.princeton.edu',
      'https://princeton.joinhandshake.com/employers',
      {
        // Handshake login
        login: {
          email: 'input[name="email"], #email',
          password: 'input[name="password"], #password',
          submitButton: 'button[type="submit"]',
          ssoButton: 'button:has-text("Single Sign-On")'
        },
        // Job form selectors (Handshake)
        jobForm: {
          title: 'input[name="title"]',
          description: 'textarea[name="description"]',
          location: 'input[name="location"]',
          employmentType: 'select[name="job_type"]',
          salaryMin: 'input[name="salary_min"]',
          salaryMax: 'input[name="salary_max"]',
          contactEmail: 'input[name="apply_email"]',
          externalUrl: 'input[name="apply_url"]',
          // Handshake specific
          jobFunction: 'select[name="job_function"]',
          experienceLevel: 'select[name="experience_level"]',
          remoteOption: 'select[name="remote_option"]',
          applicationDeadline: 'input[name="expiration_date"]'
        },
        // Navigation
        postJobButton: 'a:has-text("Post a Job"), button:has-text("Post Job")',
        continueButton: 'button:has-text("Continue")',
        submitButton: 'button:has-text("Post Job"), button:has-text("Submit")',
        // Success indicators
        successMessage: '.success-message, [role="alert"]:has-text("success")',
        jobLink: 'a[href*="/jobs/"]'
      }
    );
  }

  async login(page: Page, credentials: any): Promise<boolean> {
    try {
      // Navigate to Handshake employer portal
      await page.goto(this.postUrl, { waitUntil: 'networkidle' });

      // Check if already logged in
      const dashboard = await page.$('text=/dashboard/i, text=/post a job/i');
      if (dashboard) {
        console.log('✅ Already logged in to Princeton/Handshake');
        return true;
      }

      // Handle Handshake login
      const emailField = await page.$(this.selectors.login.email);
      if (emailField) {
        // Standard email/password login
        await this.safeFill(page, this.selectors.login.email, credentials.email || credentials.username);
        await this.safeFill(page, this.selectors.login.password, credentials.password);

        // Submit login
        await Promise.all([
          page.waitForLoadState('networkidle'),
          this.safeClick(page, this.selectors.login.submitButton)
        ]);

        // Check for SSO redirect
        const ssoPrompt = await page.$(this.selectors.login.ssoButton);
        if (ssoPrompt) {
          console.log('⚠️ SSO authentication required - manual intervention may be needed');
          await ssoPrompt.click();
          await page.waitForTimeout(5000);
        }

        // Check for MFA
        const mfaPrompt = await page.$('input[name="code"], input[name="otp"]');
        if (mfaPrompt) {
          console.log('⚠️ Multi-factor authentication required');
          return false;
        }

        // Verify login success
        const postJobOption = await page.$('text=/post/i');
        return !!postJobOption;
      }

      console.log('⚠️ Could not find login form');
      return false;
    } catch (error: any) {
      console.error('Princeton/Handshake login error:', error);
      return false;
    }
  }

  async fillJobForm(page: Page, jobData: JobData): Promise<void> {
    // Click on Post a Job button
    const postJobButton = await page.$(this.selectors.postJobButton);
    if (postJobButton) {
      await postJobButton.click();
      await page.waitForTimeout(3000);
    }

    // Handshake often has a multi-step form
    // Step 1: Job Details
    await this.safeFill(page, this.selectors.jobForm.title, jobData.title);
    await this.safeFill(page, this.selectors.jobForm.description, this.formatDescription(jobData));

    // Employment type
    if (jobData.employmentType && this.selectors.jobForm.employmentType) {
      const handshakeTypes: Record<string, string> = {
        'full-time': 'Full-Time',
        'part-time': 'Part-Time',
        'internship': 'Internship',
        'contract': 'Temporary/Contract',
        'volunteer': 'Volunteer'
      };

      const jobType = handshakeTypes[jobData.employmentType.toLowerCase()] || 'Full-Time';
      await page.selectOption(this.selectors.jobForm.employmentType, jobType);
    }

    // Job function (required by Handshake)
    if (this.selectors.jobForm.jobFunction) {
      // Default to first available option or "Other"
      const options = await page.$$eval(
        `${this.selectors.jobForm.jobFunction} option`,
        opts => opts.map(opt => opt.value).filter(v => v)
      );
      if (options.length > 0) {
        await page.selectOption(this.selectors.jobForm.jobFunction, options[0]);
      }
    }

    // Experience level
    if (this.selectors.jobForm.experienceLevel) {
      await page.selectOption(this.selectors.jobForm.experienceLevel, 'Entry Level');
    }

    // Click continue if multi-step
    const continueButton = await page.$(this.selectors.continueButton);
    if (continueButton) {
      await continueButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 2: Location & Compensation
    await this.safeFill(page, this.selectors.jobForm.location, jobData.location);

    // Remote options
    if (this.selectors.jobForm.remoteOption) {
      await page.selectOption(this.selectors.jobForm.remoteOption, 'On-Site');
    }

    // Salary information
    if (jobData.salaryMin) {
      await this.safeFill(page, this.selectors.jobForm.salaryMin, jobData.salaryMin.toString());
    }
    if (jobData.salaryMax) {
      await this.safeFill(page, this.selectors.jobForm.salaryMax, jobData.salaryMax.toString());
    }

    // Continue to next step
    const continueButton2 = await page.$(this.selectors.continueButton);
    if (continueButton2) {
      await continueButton2.click();
      await page.waitForTimeout(2000);
    }

    // Step 3: Application Details
    await this.safeFill(page, this.selectors.jobForm.contactEmail, jobData.contactEmail);

    // If external URL field exists, use email
    if (this.selectors.jobForm.externalUrl) {
      await this.safeFill(
        page, 
        this.selectors.jobForm.externalUrl, 
        `mailto:${jobData.contactEmail}?subject=${encodeURIComponent(jobData.title)}`
      );
    }

    // Set application deadline (30 days)
    if (this.selectors.jobForm.applicationDeadline) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      const deadlineStr = deadline.toISOString().split('T')[0];
      await this.safeFill(page, this.selectors.jobForm.applicationDeadline, deadlineStr);
    }

    // Wait for final form validation
    await page.waitForTimeout(1500);
  }

  async submitJob(page: Page): Promise<PostingResult> {
    try {
      // Find submit button
      let submitButton = await page.$(this.selectors.submitButton);
      
      // Handshake might have "Preview" before final submit
      const previewButton = await page.$('button:has-text("Preview")');
      if (previewButton) {
        await previewButton.click();
        await page.waitForTimeout(3000);

        // After preview, look for final submit
        submitButton = await page.$('button:has-text("Post"), button:has-text("Confirm")');
      }

      if (!submitButton) {
        throw new Error('Submit button not found');
      }

      // Submit the job
      await Promise.all([
        page.waitForLoadState('networkidle'),
        submitButton.click()
      ]);

      // Wait for result
      await page.waitForTimeout(5000);

      // Check for success
      const successFound = await browserService.waitForSuccessIndicator(page, [
        this.selectors.successMessage,
        'text=/successfully posted/i',
        'text=/job has been posted/i',
        'text=/posting is now live/i'
      ]);

      if (successFound) {
        let externalUrl: string | undefined;

        // Handshake usually redirects to the job page
        const jobLink = await page.$(this.selectors.jobLink);
        if (jobLink) {
          externalUrl = await jobLink.getAttribute('href') || undefined;
          if (externalUrl && !externalUrl.startsWith('http')) {
            externalUrl = new URL(externalUrl, page.url()).toString();
          }
        }

        // Check current URL
        const currentUrl = page.url();
        if (!externalUrl && currentUrl.includes('/jobs/')) {
          externalUrl = currentUrl;
        }

        return {
          success: true,
          externalUrl,
          screenshot: await page.screenshot({ fullPage: true })
        };
      }

      // Check for errors
      const errorElements = await page.$$('.error, .alert-danger, [role="alert"]:has-text("error")');
      if (errorElements.length > 0) {
        const errors = await Promise.all(
          errorElements.map(el => el.textContent())
        );

        return {
          success: false,
          errorMessage: errors.filter(Boolean).join('; '),
          screenshot: await page.screenshot({ fullPage: true })
        };
      }

      // Check if stuck on preview
      const stillOnPreview = await page.$('text=/preview/i');
      if (stillOnPreview) {
        return {
          success: false,
          errorMessage: 'Job posting stuck in preview mode - manual submission may be required',
          screenshot: await page.screenshot({ fullPage: true })
        };
      }

      return {
        success: false,
        errorMessage: 'Could not confirm job posting status',
        screenshot: await page.screenshot({ fullPage: true })
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || 'Failed to submit job posting',
        screenshot: await page.screenshot({ fullPage: true }).catch(() => undefined)
      };
    }
  }
}