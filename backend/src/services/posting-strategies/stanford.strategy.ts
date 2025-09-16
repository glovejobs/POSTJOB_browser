import { Page } from 'playwright';
import { BasePostingStrategy } from './base.strategy';
import { JobData, PostingResult } from '../browser.service';

export class StanfordPostingStrategy extends BasePostingStrategy {
  constructor() {
    super(
      'Stanford University',
      'https://careersearch.stanford.edu',
      'https://careersearch.stanford.edu/jobs/post',
      {
        // Login selectors
        login: {
          username: '#username',
          password: '#password',
          submitButton: 'button[type="submit"]'
        },
        // Job form selectors
        jobForm: {
          title: 'input[name="jobTitle"]',
          description: 'textarea[name="description"]',
          location: 'input[name="location"]',
          department: 'select[name="department"]',
          salaryMin: 'input[name="minSalary"]',
          salaryMax: 'input[name="maxSalary"]',
          employmentType: 'select[name="jobType"]',
          contactEmail: 'input[name="contactEmail"]',
          // Stanford specific fields
          requisitionNumber: 'input[name="reqNumber"]',
          jobCategory: 'select[name="jobCategory"]'
        },
        // Navigation
        postJobLink: 'a:has-text("Post a Job")',
        submitButton: 'button:has-text("Submit Job")',
        // Success indicators
        successMessage: '.alert-success',
        confirmationNumber: '.confirmation-number'
      }
    );
  }

  async login(page: Page, credentials: any): Promise<boolean> {
    try {
      // Navigate to login page if needed
      await page.goto(this.loginUrl, { waitUntil: 'networkidle' });

      // Check if already logged in
      const loggedIn = await page.$('a:has-text("Logout")');
      if (loggedIn) {
        console.log('✅ Already logged in to Stanford job board');
        return true;
      }

      // Look for SUNet ID login
      const sunetLogin = await page.$('a:has-text("SUNet ID")');
      if (sunetLogin) {
        await sunetLogin.click();
        await page.waitForTimeout(2000);
      }

      // Fill login credentials
      await this.safeFill(page, this.selectors.login.username, credentials.username);
      await this.safeFill(page, this.selectors.login.password, credentials.password);
      
      // Submit login
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        this.safeClick(page, this.selectors.login.submitButton)
      ]);

      // Check for two-factor authentication
      const twoFactorPrompt = await page.$('input[name="verificationCode"]');
      if (twoFactorPrompt) {
        console.log('⚠️ Two-factor authentication required - manual intervention needed');
        return false;
      }

      // Verify login success
      const profileLink = await page.$('a[href*="/profile"]');
      return !!profileLink;
    } catch (error: any) {
      console.error('Stanford login error:', error);
      return false;
    }
  }

  async fillJobForm(page: Page, jobData: JobData): Promise<void> {
    // Navigate to job posting form if needed
    const postJobLink = await page.$(this.selectors.postJobLink);
    if (postJobLink) {
      await postJobLink.click();
      await page.waitForTimeout(3000);
    }

    // Fill required fields
    await this.safeFill(page, this.selectors.jobForm.title, jobData.title);
    await this.safeFill(page, this.selectors.jobForm.description, this.formatDescription(jobData));
    await this.safeFill(page, this.selectors.jobForm.location, jobData.location);
    await this.safeFill(page, this.selectors.jobForm.contactEmail, jobData.contactEmail);

    // Fill department if available
    if (jobData.department && this.selectors.jobForm.department) {
      const departmentSelect = await page.$(this.selectors.jobForm.department);
      if (departmentSelect) {
        // Try to find matching option
        const options = await page.$$eval(
          `${this.selectors.jobForm.department} option`,
          (opts, dept) => {
            const matches = opts.filter(opt => 
              opt.textContent?.toLowerCase().includes(dept.toLowerCase())
            );
            return matches.length > 0 ? matches[0].value : null;
          },
          jobData.department
        );

        if (options) {
          await page.selectOption(this.selectors.jobForm.department, options);
        }
      }
    }

    // Fill salary information
    if (jobData.salaryMin) {
      await this.safeFill(page, this.selectors.jobForm.salaryMin, jobData.salaryMin.toString());
    }
    if (jobData.salaryMax) {
      await this.safeFill(page, this.selectors.jobForm.salaryMax, jobData.salaryMax.toString());
    }

    // Fill employment type
    if (jobData.employmentType && this.selectors.jobForm.employmentType) {
      const typeMapping: Record<string, string> = {
        'full-time': 'Full Time',
        'part-time': 'Part Time',
        'contract': 'Fixed Term',
        'internship': 'Student'
      };

      const mappedType = typeMapping[jobData.employmentType.toLowerCase()] || jobData.employmentType;
      await page.selectOption(this.selectors.jobForm.employmentType, { label: mappedType });
    }

    // Generate requisition number if needed
    if (this.selectors.jobForm.requisitionNumber) {
      const reqNumber = `EXT-${Date.now()}`;
      await this.safeFill(page, this.selectors.jobForm.requisitionNumber, reqNumber);
    }

    // Select job category if available
    if (this.selectors.jobForm.jobCategory) {
      // Default to "Administrative" or first available option
      const firstOption = await page.$eval(
        `${this.selectors.jobForm.jobCategory} option:nth-child(2)`,
        opt => opt.getAttribute('value')
      );
      if (firstOption) {
        await page.selectOption(this.selectors.jobForm.jobCategory, firstOption);
      }
    }

    // Wait for form validation
    await page.waitForTimeout(1500);
  }

  async submitJob(page: Page): Promise<PostingResult> {
    try {
      // Look for submit button
      const submitButton = await page.$(this.selectors.submitButton);
      if (!submitButton) {
        throw new Error('Submit button not found');
      }

      // Click submit and wait for response
      await Promise.all([
        page.waitForLoadState('networkidle'),
        submitButton.click()
      ]);

      // Wait for result
      await page.waitForTimeout(5000);

      // Check for success
      const successMessage = await page.$(this.selectors.successMessage);
      const confirmationNumber = await page.$(this.selectors.confirmationNumber);

      if (successMessage || confirmationNumber) {
        let externalUrl: string | undefined;

        // Extract confirmation number
        if (confirmationNumber) {
          const confNumber = await confirmationNumber.textContent();
          if (confNumber) {
            externalUrl = `${this.boardName} - Confirmation: ${confNumber.trim()}`;
          }
        }

        // Check if redirected to job details page
        const currentUrl = page.url();
        if (currentUrl.includes('/jobs/') && currentUrl !== this.postUrl) {
          externalUrl = currentUrl;
        }

        return {
          success: true,
          externalUrl,
          screenshot: await page.screenshot({ fullPage: true })
        };
      }

      // Check for validation errors
      const validationErrors = await page.$$('.field-error, .error-message');
      if (validationErrors.length > 0) {
        const errors = await Promise.all(
          validationErrors.map(el => el.textContent())
        );
        return {
          success: false,
          errorMessage: `Validation errors: ${errors.filter(Boolean).join(', ')}`,
          screenshot: await page.screenshot({ fullPage: true })
        };
      }

      // No clear indication of success or failure
      return {
        success: false,
        errorMessage: 'Could not determine submission status',
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