import { Page } from 'playwright';
import { BasePostingStrategy } from './base.strategy';
import { JobData, PostingResult, browserService } from '../browser.service';

export class YalePostingStrategy extends BasePostingStrategy {
  constructor() {
    super(
      'Yale University',
      'https://ocs.yale.edu',
      'https://ocs.yale.edu/employers/post-job',
      {
        // Login selectors
        login: {
          username: '#username, #netid',
          password: '#password',
          submitButton: 'input[type="submit"], button:has-text("Login")',
          employerLoginLink: 'a:has-text("Employer Login")'
        },
        // Job form selectors
        jobForm: {
          title: 'input[name="title"], #jobTitle',
          description: 'textarea[name="description"], #jobDescription',
          location: 'input[name="location"], #location',
          company: 'input[name="organization"], #companyName',
          department: 'input[name="department"]',
          salaryMin: 'input[name="salaryMin"]',
          salaryMax: 'input[name="salaryMax"]',
          employmentType: 'select[name="type"], #jobType',
          contactEmail: 'input[name="email"], #contactEmail',
          contactName: 'input[name="contactName"]',
          // Yale specific fields
          targetSchools: 'input[name="targetSchools"]',
          deadline: 'input[name="deadline"]',
          startDate: 'input[name="startDate"]',
          qualifications: 'textarea[name="qualifications"]'
        },
        // Navigation
        postJobLink: 'a:has-text("Post a Position")',
        submitButton: 'button:has-text("Submit"), input[value="Submit"]',
        // Success indicators
        successMessage: '.message-success, .confirmation',
        referenceNumber: '.reference-number'
      }
    );
  }

  async login(page: Page, credentials: any): Promise<boolean> {
    try {
      // Navigate to OCS page
      await page.goto(this.loginUrl, { waitUntil: 'networkidle' });

      // Look for employer section
      const employerLink = await page.$(this.selectors.login.employerLoginLink);
      if (employerLink) {
        await employerLink.click();
        await page.waitForTimeout(2000);
      }

      // Check if CAS login is required
      const casLogin = await page.$('text=/Central Authentication Service/i');
      if (casLogin) {
        console.log('⚠️ Yale CAS authentication detected - may require Yale NetID');
      }

      // Fill login form
      const usernameField = await page.$(this.selectors.login.username);
      if (usernameField) {
        await this.safeFill(page, this.selectors.login.username, credentials.username);
        await this.safeFill(page, this.selectors.login.password, credentials.password);
        
        await Promise.all([
          page.waitForLoadState('networkidle'),
          this.safeClick(page, this.selectors.login.submitButton)
        ]);

        // Check for login errors
        const loginError = await page.$('.error, .alert');
        if (loginError) {
          const errorText = await loginError.textContent();
          console.error(`Yale login error: ${errorText}`);
          return false;
        }
      } else {
        // No login form found, might be open access
        console.log('✅ No login required for Yale job posting');
      }

      return true;
    } catch (error: any) {
      console.error('Yale login error:', error);
      return false;
    }
  }

  async fillJobForm(page: Page, jobData: JobData): Promise<void> {
    // Navigate to job posting form
    const postJobLink = await page.$(this.selectors.postJobLink);
    if (postJobLink) {
      await postJobLink.click();
      await page.waitForTimeout(3000);
    } else {
      // Try direct navigation
      await page.goto(this.postUrl, { waitUntil: 'networkidle' });
    }

    // Fill basic job information
    await this.safeFill(page, this.selectors.jobForm.title, jobData.title);
    await this.safeFill(page, this.selectors.jobForm.description, this.formatDescription(jobData));
    await this.safeFill(page, this.selectors.jobForm.location, jobData.location);
    await this.safeFill(page, this.selectors.jobForm.company, jobData.company);
    await this.safeFill(page, this.selectors.jobForm.contactEmail, jobData.contactEmail);

    // Fill optional fields
    if (jobData.department && this.selectors.jobForm.department) {
      await this.safeFill(page, this.selectors.jobForm.department, jobData.department);
    }

    // Fill contact name if required
    if (this.selectors.jobForm.contactName) {
      await this.safeFill(page, this.selectors.jobForm.contactName, 'Hiring Manager');
    }

    // Fill salary information
    if (jobData.salaryMin && this.selectors.jobForm.salaryMin) {
      await this.safeFill(page, this.selectors.jobForm.salaryMin, jobData.salaryMin.toString());
    }
    if (jobData.salaryMax && this.selectors.jobForm.salaryMax) {
      await this.safeFill(page, this.selectors.jobForm.salaryMax, jobData.salaryMax.toString());
    }

    // Select employment type
    if (jobData.employmentType && this.selectors.jobForm.employmentType) {
      const typeMapping: Record<string, string> = {
        'full-time': 'Full-Time',
        'part-time': 'Part-Time',
        'internship': 'Internship',
        'contract': 'Contract/Temporary'
      };

      const yaleType = typeMapping[jobData.employmentType.toLowerCase()] || 'Full-Time';
      
      const selectElement = await page.$(this.selectors.jobForm.employmentType);
      if (selectElement) {
        const tagName = await selectElement.evaluate(el => el.tagName);
        if (tagName === 'SELECT') {
          await page.selectOption(this.selectors.jobForm.employmentType, { label: yaleType });
        } else {
          // Might be radio buttons or checkboxes
          const typeOption = await page.$(`input[value="${yaleType}"]`);
          if (typeOption) {
            await typeOption.click();
          }
        }
      }
    }

    // Fill Yale-specific fields
    if (this.selectors.jobForm.targetSchools) {
      await this.safeFill(page, this.selectors.jobForm.targetSchools, 'All Schools');
    }

    // Set application deadline (30 days from now)
    if (this.selectors.jobForm.deadline) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      const deadlineStr = deadline.toISOString().split('T')[0];
      await this.safeFill(page, this.selectors.jobForm.deadline, deadlineStr);
    }

    // Set start date (45 days from now)
    if (this.selectors.jobForm.startDate) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 45);
      const startDateStr = startDate.toISOString().split('T')[0];
      await this.safeFill(page, this.selectors.jobForm.startDate, startDateStr);
    }

    // Add qualifications if field exists
    if (this.selectors.jobForm.qualifications) {
      const qualifications = `• Bachelor's degree or equivalent experience
• Strong communication and analytical skills
• Ability to work independently and as part of a team`;
      await this.safeFill(page, this.selectors.jobForm.qualifications, qualifications);
    }

    // Handle any required checkboxes
    const requiredCheckboxes = await page.$$('input[type="checkbox"][required]');
    for (const checkbox of requiredCheckboxes) {
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.click();
      }
    }

    // Wait for form validation
    await page.waitForTimeout(1500);
  }

  async submitJob(page: Page): Promise<PostingResult> {
    try {
      // Find and click submit button
      const submitButton = await page.$(this.selectors.submitButton);
      if (!submitButton) {
        // Try alternative submit selectors
        const altSubmit = await page.$('button[type="submit"], input[type="submit"]');
        if (!altSubmit) {
          throw new Error('Submit button not found');
        }
        await altSubmit.click();
      } else {
        await submitButton.click();
      }

      // Wait for submission to process
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      // Check for success
      const successIndicators = [
        this.selectors.successMessage,
        this.selectors.referenceNumber,
        'text=/successfully submitted/i',
        'text=/thank you/i',
        'text=/confirmation/i',
        'text=/received your posting/i'
      ];

      const foundIndicator = await browserService.waitForSuccessIndicator(page, successIndicators);

      if (foundIndicator) {
        let externalUrl: string | undefined;

        // Try to extract reference number
        const refElement = await page.$(this.selectors.referenceNumber);
        if (refElement) {
          const refNumber = await refElement.textContent();
          if (refNumber) {
            externalUrl = `Yale OCS - Reference: ${refNumber.trim()}`;
          }
        }

        // Check if redirected to a confirmation page
        const currentUrl = page.url();
        if (currentUrl.includes('confirmation') || currentUrl.includes('success')) {
          externalUrl = currentUrl;
        }

        return {
          success: true,
          externalUrl,
          screenshot: await page.screenshot({ fullPage: true })
        };
      }

      // Check for validation errors
      const errorMessages = await page.$$('.error-message, .field-error, .alert-error');
      if (errorMessages.length > 0) {
        const errors = await Promise.all(
          errorMessages.map(async (el) => {
            const text = await el.textContent();
            return text?.trim();
          })
        );

        return {
          success: false,
          errorMessage: `Validation errors: ${errors.filter(Boolean).join(', ')}`,
          screenshot: await page.screenshot({ fullPage: true })
        };
      }

      // No clear success or error
      return {
        success: false,
        errorMessage: 'Unable to confirm submission status',
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