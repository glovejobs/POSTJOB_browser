import { Page } from 'playwright';
import { BasePostingStrategy } from './base.strategy';
import { JobData, PostingResult, browserService } from '../browser.service';

export class MITPostingStrategy extends BasePostingStrategy {
  constructor() {
    super(
      'MIT',
      'https://careers.mit.edu',
      'https://careers.mit.edu/external/post-job',
      {
        // Login/Registration selectors
        login: {
          email: 'input[name="email"]',
          password: 'input[name="password"]',
          submitButton: 'button[type="submit"]:has-text("Sign In")',
          registerLink: 'a:has-text("Create Account")'
        },
        // Registration form
        register: {
          companyName: 'input[name="companyName"]',
          firstName: 'input[name="firstName"]',
          lastName: 'input[name="lastName"]',
          email: 'input[name="email"]',
          password: 'input[name="password"]',
          confirmPassword: 'input[name="confirmPassword"]',
          submitButton: 'button[type="submit"]:has-text("Register")'
        },
        // Job form selectors
        jobForm: {
          title: '#job_title',
          description: '#job_description',
          location: '#job_location',
          department: '#department',
          salaryMin: '#salary_min',
          salaryMax: '#salary_max',
          employmentType: 'select[name="employment_type"]',
          contactEmail: '#contact_email',
          applicationUrl: '#application_url',
          // MIT specific
          industryType: 'select[name="industry"]',
          experienceLevel: 'select[name="experience_level"]',
          deadline: 'input[name="application_deadline"]'
        },
        // Navigation
        postJobButton: 'a:has-text("Post a Job")',
        submitButton: 'button:has-text("Submit Job Posting")',
        previewButton: 'button:has-text("Preview")',
        // Success indicators
        successMessage: '.success-message, .alert-success',
        jobIdElement: '.job-id, .posting-reference'
      }
    );
  }

  async login(page: Page, credentials: any): Promise<boolean> {
    try {
      // Navigate to careers page
      await page.goto(this.loginUrl, { waitUntil: 'networkidle' });

      // Check if already logged in
      const userMenu = await page.$('[aria-label="User menu"], .user-menu');
      if (userMenu) {
        console.log('✅ Already logged in to MIT careers');
        return true;
      }

      // Click on employer/post job section
      const employerSection = await page.$('a:has-text("Employers"), a:has-text("Post Jobs")');
      if (employerSection) {
        await employerSection.click();
        await page.waitForTimeout(2000);
      }

      // Check if login form is present
      const loginForm = await page.$(this.selectors.login.email);
      
      if (loginForm) {
        // Try to login
        await this.safeFill(page, this.selectors.login.email, credentials.email || credentials.username);
        await this.safeFill(page, this.selectors.login.password, credentials.password);
        
        await Promise.all([
          page.waitForLoadState('networkidle'),
          this.safeClick(page, this.selectors.login.submitButton)
        ]);

        // Check for login errors
        const errorMessage = await page.$('.error-message, .alert-danger');
        if (errorMessage) {
          const errorText = await errorMessage.textContent();
          
          // If account doesn't exist, try to register
          if (errorText?.toLowerCase().includes('not found') || errorText?.toLowerCase().includes('does not exist')) {
            return await this.register(page, credentials);
          }
          
          throw new Error(`Login failed: ${errorText}`);
        }

        return true;
      }

      // No login required
      console.log('✅ No login required for MIT job posting');
      return true;
    } catch (error: any) {
      console.error('MIT login error:', error);
      return false;
    }
  }

  private async register(page: Page, credentials: any): Promise<boolean> {
    try {
      console.log('📝 Attempting to register new employer account...');
      
      // Click register link
      const registerLink = await page.$(this.selectors.login.registerLink);
      if (registerLink) {
        await registerLink.click();
        await page.waitForTimeout(2000);
      }

      // Fill registration form
      await this.safeFill(page, this.selectors.register.companyName, credentials.company || 'External Company');
      await this.safeFill(page, this.selectors.register.firstName, 'Recruiter');
      await this.safeFill(page, this.selectors.register.lastName, 'Account');
      await this.safeFill(page, this.selectors.register.email, credentials.email || credentials.username);
      await this.safeFill(page, this.selectors.register.password, credentials.password);
      await this.safeFill(page, this.selectors.register.confirmPassword, credentials.password);

      // Submit registration
      await Promise.all([
        page.waitForLoadState('networkidle'),
        this.safeClick(page, this.selectors.register.submitButton)
      ]);

      // Check for registration success
      const welcomeMessage = await page.$('text=/welcome/i, text=/successfully registered/i');
      return !!welcomeMessage;
    } catch (error: any) {
      console.error('MIT registration error:', error);
      return false;
    }
  }

  async fillJobForm(page: Page, jobData: JobData): Promise<void> {
    // Navigate to job posting page
    const postJobButton = await page.$(this.selectors.postJobButton);
    if (postJobButton) {
      await postJobButton.click();
      await page.waitForTimeout(3000);
    }

    // Fill basic information
    await this.safeFill(page, this.selectors.jobForm.title, jobData.title);
    await this.safeFill(page, this.selectors.jobForm.description, this.formatDescription(jobData));
    await this.safeFill(page, this.selectors.jobForm.location, jobData.location);
    await this.safeFill(page, this.selectors.jobForm.contactEmail, jobData.contactEmail);

    // Fill department
    if (jobData.department) {
      await this.safeFill(page, this.selectors.jobForm.department, jobData.department);
    }

    // Fill salary range
    if (jobData.salaryMin) {
      await this.safeFill(page, this.selectors.jobForm.salaryMin, jobData.salaryMin.toString());
    }
    if (jobData.salaryMax) {
      await this.safeFill(page, this.selectors.jobForm.salaryMax, jobData.salaryMax.toString());
    }

    // Select employment type
    if (jobData.employmentType && this.selectors.jobForm.employmentType) {
      const typeMapping: Record<string, string> = {
        'full-time': 'Full-Time',
        'part-time': 'Part-Time',
        'contract': 'Contract',
        'internship': 'Internship',
        'temporary': 'Temporary'
      };

      const mitType = typeMapping[jobData.employmentType.toLowerCase()] || 'Full-Time';
      await page.selectOption(this.selectors.jobForm.employmentType, mitType);
    }

    // Add application URL (use contact email if no specific URL)
    if (this.selectors.jobForm.applicationUrl) {
      await this.safeFill(
        page, 
        this.selectors.jobForm.applicationUrl, 
        `mailto:${jobData.contactEmail}`
      );
    }

    // Set default values for MIT-specific fields
    if (this.selectors.jobForm.industryType) {
      await page.selectOption(this.selectors.jobForm.industryType, { index: 1 });
    }

    if (this.selectors.jobForm.experienceLevel) {
      await page.selectOption(this.selectors.jobForm.experienceLevel, 'Entry Level');
    }

    // Set application deadline (30 days from now)
    if (this.selectors.jobForm.deadline) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      const deadlineStr = deadline.toISOString().split('T')[0];
      await this.safeFill(page, this.selectors.jobForm.deadline, deadlineStr);
    }

    // Wait for form validation
    await page.waitForTimeout(1500);
  }

  async submitJob(page: Page): Promise<PostingResult> {
    try {
      // Click preview if available
      const previewButton = await page.$(this.selectors.previewButton);
      if (previewButton) {
        await previewButton.click();
        await page.waitForTimeout(3000);

        // Look for confirmation button after preview
        const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Submit")');
        if (confirmButton) {
          await confirmButton.click();
          await page.waitForTimeout(3000);
        }
      }

      // Submit the job posting
      const submitButton = await page.$(this.selectors.submitButton);
      if (!submitButton) {
        throw new Error('Submit button not found');
      }

      await Promise.all([
        page.waitForLoadState('networkidle'),
        submitButton.click()
      ]);

      // Wait for submission to complete
      await page.waitForTimeout(5000);

      // Check for success indicators
      const successIndicators = await browserService.waitForSuccessIndicator(page, [
        this.selectors.successMessage,
        this.selectors.jobIdElement,
        'text=/successfully posted/i',
        'text=/posting confirmed/i',
        'text=/thank you/i'
      ]);

      if (successIndicators) {
        let externalUrl: string | undefined;

        // Try to extract job ID or reference
        const jobIdElement = await page.$(this.selectors.jobIdElement);
        if (jobIdElement) {
          const jobId = await jobIdElement.textContent();
          if (jobId) {
            const cleanId = jobId.replace(/[^0-9A-Z-]/gi, '');
            externalUrl = `${this.loginUrl}/jobs/${cleanId}`;
          }
        }

        // Check current URL for job ID
        const currentUrl = page.url();
        if (!externalUrl && (currentUrl.includes('/job/') || currentUrl.includes('id='))) {
          externalUrl = currentUrl;
        }

        return {
          success: true,
          externalUrl,
          screenshot: await page.screenshot({ fullPage: true })
        };
      }

      // Check for errors
      const errorMessages = await page.$$('.error, .alert-danger, [role="alert"]');
      if (errorMessages.length > 0) {
        const errors = await Promise.all(
          errorMessages.map(el => el.textContent())
        );
        return {
          success: false,
          errorMessage: errors.filter(Boolean).join('; '),
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
        errorMessage: error.message || 'Failed to submit job',
        screenshot: await page.screenshot({ fullPage: true }).catch(() => undefined)
      };
    }
  }
}