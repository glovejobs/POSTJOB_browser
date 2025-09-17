import nodemailer from 'nodemailer';
import { config } from '../config/environment';
import path from 'path';
import fs from 'fs/promises';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface JobEmailData {
  id: string;
  title: string;
  company: string;
  location: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // In development, use a test account or log to console
    if (config.NODE_ENV === 'development') {
      // For development, we'll just log emails to console
      console.log('Email service initialized in development mode - emails will be logged to console');
    } else if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      // Production email configuration
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT || 587,
        secure: config.SMTP_PORT === 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        }
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const { to, subject, html, text } = options;

    const mailOptions = {
      from: config.EMAIL_FROM || '"PostJob" <noreply@postjob.com>',
      to,
      subject,
      html,
      text: text || this.htmlToText(html)
    };

    if (config.NODE_ENV === 'development' || !this.transporter) {
      // In development, log email to console
      console.log('\n=== EMAIL SENT (Development Mode) ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', text || this.htmlToText(html));
      console.log('=====================================\n');
      return;
    }

    // In production, send actual email
    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', to);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #484848;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #FF5A5F;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border: 1px solid #EBEBEB;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #FF5A5F;
              color: white !important;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #E84C51;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #767676;
            }
            .warning {
              background-color: #FFF8E1;
              border: 1px solid #FFE082;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PostJob</h1>
            <p style="margin: 0; font-size: 18px;">Password Reset Request</p>
          </div>
          
          <div class="content">
            <h2 style="color: #484848; margin-top: 0;">Reset Your Password</h2>
            
            <p>We received a request to reset the password for your PostJob account associated with this email address.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
            </div>
            
            <p style="font-size: 14px; color: #767676;">
              Or copy and paste this link into your browser:<br>
              <code style="background-color: #F7F7F7; padding: 4px 8px; border-radius: 4px; word-break: break-all;">
                ${resetUrl}
              </code>
            </p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This password reset link will expire in 1 hour for security reasons.
            </div>
            
            <p>If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              The PostJob Team
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} PostJob. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your PostJob Password',
      html
    });
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #484848;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #FF5A5F;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border: 1px solid #EBEBEB;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #00A699;
              color: white !important;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .features {
              background-color: #F7F7F7;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .feature {
              margin: 10px 0;
              padding-left: 25px;
              position: relative;
            }
            .feature::before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #00A699;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to PostJob!</h1>
            <p style="margin: 0; font-size: 18px;">Your account has been created successfully</p>
          </div>
          
          <div class="content">
            <h2 style="color: #484848; margin-top: 0;">Hi${name ? ` ${name}` : ''}!</h2>
            
            <p>Welcome to PostJob - the easiest way to post your job openings to multiple university career boards with just one click!</p>
            
            <div class="features">
              <h3 style="margin-top: 0; color: #484848;">With PostJob, you can:</h3>
              <div class="feature">Post to 5 top university job boards simultaneously</div>
              <div class="feature">Save time with our automated posting process</div>
              <div class="feature">Track your job posting status in real-time</div>
              <div class="feature">Pay only $2.99 per job posting</div>
            </div>
            
            <div style="text-align: center;">
              <a href="${config.FRONTEND_URL}" class="button" style="color: white;">Start Posting Jobs</a>
            </div>
            
            <p style="margin-top: 30px;">
              If you have any questions, feel free to reach out to our support team.
            </p>
            
            <p>
              Happy hiring!<br>
              The PostJob Team
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to PostJob - Start Posting Jobs Today!',
      html
    });
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async sendJobCreatedEmail(email: string, jobData: JobEmailData): Promise<void> {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', 'job-created.hbs');
    let html: string;

    try {
      // Try to load template file
      html = await fs.readFile(templatePath, 'utf-8');
      // Replace template variables
      html = html
        .replace(/\{\{jobTitle\}\}/g, jobData.title)
        .replace(/\{\{company\}\}/g, jobData.company)
        .replace(/\{\{location\}\}/g, jobData.location)
        .replace(/\{\{jobUrl\}\}/g, `${config.FRONTEND_URL}/job/${jobData.id}`)
        .replace(/\{\{editUrl\}\}/g, `${config.FRONTEND_URL}/job/${jobData.id}/edit`)
        .replace(/\{\{dashboardUrl\}\}/g, `${config.FRONTEND_URL}/dashboard`)
        .replace(/\{\{brandName\}\}/g, 'PostJob')
        .replace(/\{\{supportUrl\}\}/g, `${config.FRONTEND_URL}/support`)
        .replace(/\{\{unsubscribeUrl\}\}/g, `${config.FRONTEND_URL}/unsubscribe`);
    } catch (error) {
      // Fallback to simple template if file doesn't exist
      html = `
        <h2>Job Created Successfully!</h2>
        <p>Your job posting "${jobData.title}" at ${jobData.company} has been created.</p>
        <p><a href="${config.FRONTEND_URL}/job/${jobData.id}">View Job</a></p>
      `;
    }

    await this.sendEmail({
      to: email,
      subject: `Job Created: ${jobData.title}`,
      html
    });
  }

  async sendJobPostedEmail(email: string, jobData: JobEmailData, boardName: string): Promise<void> {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', 'job-posted.hbs');
    let html: string;

    try {
      html = await fs.readFile(templatePath, 'utf-8');
      html = html
        .replace(/\{\{jobTitle\}\}/g, jobData.title)
        .replace(/\{\{company\}\}/g, jobData.company)
        .replace(/\{\{boardName\}\}/g, boardName)
        .replace(/\{\{jobUrl\}\}/g, `${config.FRONTEND_URL}/job/${jobData.id}`)
        .replace(/\{\{statusUrl\}\}/g, `${config.FRONTEND_URL}/job/${jobData.id}/status`)
        .replace(/\{\{dashboardUrl\}\}/g, `${config.FRONTEND_URL}/dashboard`)
        .replace(/\{\{brandName\}\}/g, 'PostJob')
        .replace(/\{\{supportUrl\}\}/g, `${config.FRONTEND_URL}/support`)
        .replace(/\{\{unsubscribeUrl\}\}/g, `${config.FRONTEND_URL}/unsubscribe`);
    } catch (error) {
      html = `
        <h2>Job Posted Successfully!</h2>
        <p>Your job "${jobData.title}" has been posted to ${boardName}.</p>
        <p><a href="${config.FRONTEND_URL}/job/${jobData.id}/status">View Status</a></p>
      `;
    }

    await this.sendEmail({
      to: email,
      subject: `Your Job is Now Live on ${boardName}!`,
      html
    });
  }

  async sendPaymentConfirmationEmail(email: string, jobData: JobEmailData, amount: number): Promise<void> {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', 'payment-confirmation.hbs');
    let html: string;

    try {
      html = await fs.readFile(templatePath, 'utf-8');
      html = html
        .replace(/\{\{jobTitle\}\}/g, jobData.title)
        .replace(/\{\{company\}\}/g, jobData.company)
        .replace(/\{\{amount\}\}/g, (amount / 100).toFixed(2))
        .replace(/\{\{receiptNumber\}\}/g, `RCP-${Date.now()}`)
        .replace(/\{\{paymentDate\}\}/g, new Date().toISOString())
        .replace(/\{\{formatDate.*?\}\}/g, new Date().toLocaleDateString())
        .replace(/\{\{statusUrl\}\}/g, `${config.FRONTEND_URL}/job/${jobData.id}/status`)
        .replace(/\{\{dashboardUrl\}\}/g, `${config.FRONTEND_URL}/dashboard`)
        .replace(/\{\{brandName\}\}/g, 'PostJob')
        .replace(/\{\{supportUrl\}\}/g, `${config.FRONTEND_URL}/support`)
        .replace(/\{\{privacyUrl\}\}/g, `${config.FRONTEND_URL}/privacy`);
    } catch (error) {
      html = `
        <h2>Payment Confirmed</h2>
        <p>Your payment of $${(amount / 100).toFixed(2)} for "${jobData.title}" has been processed.</p>
        <p><a href="${config.FRONTEND_URL}/job/${jobData.id}/status">Track Status</a></p>
      `;
    }

    await this.sendEmail({
      to: email,
      subject: 'Payment Confirmed - Your Job is Being Posted',
      html
    });
  }

  async sendPasswordChangedEmail(email: string, name: string): Promise<void> {
    const subject = 'Password Changed - PostJob';
    const html = `
      <h1>Password Changed Successfully</h1>
      <p>Hi ${name},</p>
      <p>Your PostJob account password has been successfully changed.</p>
      <p>If you didn't make this change, please contact our support team immediately.</p>
      <p>Best regards,<br>The PostJob Team</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendAccountDeletedEmail(email: string, name: string): Promise<void> {
    const subject = 'Account Deleted - PostJob';
    const html = `
      <h1>Goodbye, ${name}</h1>
      <p>Your PostJob account has been successfully deleted.</p>
      <p>We're sorry to see you go. If you change your mind, you're always welcome back!</p>
      <p>All your data has been permanently removed from our systems.</p>
      <p>Best regards,<br>The PostJob Team</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendApplicationConfirmation(email: string, data: {
    candidateName: string;
    jobTitle: string;
    company: string;
  }): Promise<void> {
    const subject = `Application Received - ${data.jobTitle} at ${data.company}`;
    const html = `
      <h1>Thank you for applying, ${data.candidateName}!</h1>
      <p>We've received your application for the position of <strong>${data.jobTitle}</strong> at <strong>${data.company}</strong>.</p>
      <p>The hiring team will review your application and get back to you soon.</p>
      <p>Good luck!</p>
      <p>Best regards,<br>The ${data.company} Team</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendNewApplicationNotification(email: string, data: {
    jobTitle: string;
    candidateName: string;
    candidateEmail: string;
    applicationId: string;
  }): Promise<void> {
    const subject = `New Application - ${data.jobTitle}`;
    const html = `
      <h1>New Application Received</h1>
      <p>You have a new application for <strong>${data.jobTitle}</strong>.</p>
      <p><strong>Candidate:</strong> ${data.candidateName}</p>
      <p><strong>Email:</strong> ${data.candidateEmail}</p>
      <p>View the application in your dashboard to review and respond.</p>
      <p>Application ID: ${data.applicationId}</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendApplicationStatusUpdate(email: string, data: {
    candidateName: string;
    jobTitle: string;
    company: string;
    status: string;
  }): Promise<void> {
    const statusMessages: Record<string, string> = {
      interview: 'Congratulations! You have been selected for an interview.',
      rejected: 'After careful consideration, we have decided to move forward with other candidates.',
      hired: 'Congratulations! We are pleased to offer you the position.'
    };

    const subject = `Application Update - ${data.jobTitle} at ${data.company}`;
    const html = `
      <h1>Application Status Update</h1>
      <p>Dear ${data.candidateName},</p>
      <p>We have an update on your application for <strong>${data.jobTitle}</strong> at <strong>${data.company}</strong>.</p>
      <p>${statusMessages[data.status] || 'Your application status has been updated.'}</p>
      ${data.status === 'interview' ? '<p>We will contact you soon with more details about the interview process.</p>' : ''}
      ${data.status === 'rejected' ? '<p>We appreciate your interest and wish you the best in your job search.</p>' : ''}
      ${data.status === 'hired' ? '<p>We will contact you soon with next steps and offer details.</p>' : ''}
      <p>Best regards,<br>The ${data.company} Team</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendApplicantCommunication(email: string, data: {
    candidateName: string;
    subject: string;
    message: string;
    jobTitle: string;
    company: string;
  }): Promise<void> {
    const subject = `${data.company} - ${data.subject}`;
    const html = `
      <h1>Message from ${data.company}</h1>
      <p>Dear ${data.candidateName},</p>
      <p>You have received a message regarding your application for <strong>${data.jobTitle}</strong>:</p>
      <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; background: #f9f9f9;">
        ${data.message.replace(/\n/g, '<br>')}
      </div>
      <p>Best regards,<br>The ${data.company} Team</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }
}

export const emailService = new EmailService();