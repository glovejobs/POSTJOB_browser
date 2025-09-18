import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { io } from '../../index';
import { emailService } from '../../services/email.service';
import db from '../../services/database.service';
import supabase from '../../database/supabase';

const router = Router();

// GET /api/applications/job/:jobId - Get applications for a specific job
router.get('/job/:jobId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    // Verify job ownership
    const job = await db.job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const applications = await db.application.findByJob(jobId);

    // Get latest communication for each application
    const applicationsWithComms = [];
    for (const app of applications) {
      const { data: communications } = await supabase
        .from('application_communications')
        .select('*')
        .eq('application_id', app.id)
        .order('sent_at', { ascending: false })
        .limit(1);

      applicationsWithComms.push({
        ...app,
        communications: communications || []
      });
    }

    return res.json(applicationsWithComms);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/:id - Get single application details
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const application = await db.application.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await db.job.findById(application.job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify job ownership
    if (job.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get communications
    const { data: communications } = await supabase
      .from('application_communications')
      .select('*')
      .eq('application_id', id)
      .order('sent_at', { ascending: false });

    const applicationWithDetails = {
      ...application,
      job,
      communications: communications || []
    };

    return res.json(applicationWithDetails);
  } catch (error) {
    console.error('Error fetching application:', error);
    return res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /api/applications - Submit a new application (public endpoint)
router.post('/', async (req, res) => {
  try {
    const {
      jobId,
      candidateName,
      candidateEmail,
      candidatePhone,
      resumeUrl,
      coverLetter,
      portfolio,
      linkedIn
    } = req.body;

    // Validate required fields
    if (!jobId || !candidateName || !candidateEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if job exists and is published
    const job = await db.job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found or not accepting applications' });
    }

    if (job.status !== 'completed') {
      return res.status(404).json({ error: 'Job not found or not accepting applications' });
    }

    const user = await db.user.findById(job.user_id);
    if (!user) {
      return res.status(404).json({ error: 'Job owner not found' });
    }

    // Check for duplicate application
    const { data: existingApplications } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('candidate_email', candidateEmail)
      .limit(1);

    const existingApplication = existingApplications?.[0];

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this position' });
    }

    // Create application
    const application = await db.application.create({
      jobId,
      candidateName,
      candidateEmail,
      candidatePhone,
      resumeUrl,
      coverLetter,
      portfolio,
      linkedIn
    });

    // Send email notifications
    try {
      // Email to candidate
      await emailService.sendApplicationConfirmation(candidateEmail, {
        candidateName,
        jobTitle: job.title,
        company: job.company
      });

      // Email to employer
      if (user.email) {
        await emailService.sendNewApplicationNotification(user.email, {
          jobTitle: job.title,
          candidateName,
          candidateEmail,
          applicationId: application.id
        });
      }
    } catch (emailError) {
      console.error('Failed to send application emails:', emailError);
    }

    // Emit socket event for real-time update
    io.to(`job-${jobId}`).emit('new-application', application);

    return res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: application.id
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
});

// PUT /api/applications/:id/status - Update application status
router.put('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user!.id;

    const validStatuses = ['new', 'screening', 'interview', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify ownership
    const application = await db.application.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await db.job.findById(application.job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update application
    const updatedApplication = await db.application.update(id, {
      status,
      notes: notes || application.notes
    });

    // Send email notification to candidate for important status changes
    if (['interview', 'rejected', 'hired'].includes(status)) {
      try {
        await emailService.sendApplicationStatusUpdate(application.candidate_email, {
          candidateName: application.candidate_name,
          jobTitle: job.title,
          company: job.company,
          status
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    // Emit socket event
    io.to(`job-${application.job_id}`).emit('application-updated', updatedApplication);

    return res.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// PUT /api/applications/:id/score - Update application score
router.put('/:id/score', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const userId = req.user!.id;

    if (score < 0 || score > 100) {
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }

    // Verify ownership
    const application = await db.application.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await db.job.findById(application.job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update score
    const updatedApplication = await db.application.update(id, { score });

    return res.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application score:', error);
    return res.status(500).json({ error: 'Failed to update score' });
  }
});

// POST /api/applications/:id/communicate - Send communication to applicant
router.post('/:id/communicate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;
    const userId = req.user!.id;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Verify ownership
    const application = await db.application.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await db.job.findById(application.job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create communication record
    const { data: communication, error: commError } = await supabase
      .from('application_communications')
      .insert({
        application_id: id,
        subject,
        message,
        direction: 'outbound',
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (commError) {
      console.error('Error creating communication:', commError);
      return res.status(500).json({ error: 'Failed to create communication record' });
    }

    // Send email to applicant
    try {
      await emailService.sendApplicantCommunication(application.candidate_email, {
        candidateName: application.candidate_name,
        subject,
        message,
        jobTitle: job.title,
        company: job.company
      });
    } catch (emailError) {
      console.error('Failed to send communication email:', emailError);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.json({
      message: 'Communication sent successfully',
      communication
    });
  } catch (error) {
    console.error('Error sending communication:', error);
    return res.status(500).json({ error: 'Failed to send communication' });
  }
});

// DELETE /api/applications/:id - Delete an application
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const application = await db.application.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await db.job.findById(application.job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete application and related communications
    await supabase
      .from('application_communications')
      .delete()
      .eq('application_id', id);

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      return res.status(500).json({ error: 'Failed to delete application' });
    }

    return res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return res.status(500).json({ error: 'Failed to delete application' });
  }
});

// GET /api/applications/stats/:jobId - Get application statistics for a job
router.get('/stats/:jobId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    // Verify job ownership
    const job = await db.job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get statistics
    const applications = await db.application.findByJob(jobId);
    const totalCount = applications.length;

    const statusCounts = applications.reduce((acc: any, app: any) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const applicationsWithScores = applications.filter((app: any) => app.score !== null);
    const avgScore = applicationsWithScores.length > 0
      ? applicationsWithScores.reduce((sum: number, app: any) => sum + app.score, 0) / applicationsWithScores.length
      : 0;

    const stats = {
      total: totalCount,
      byStatus: statusCounts,
      averageScore: avgScore
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching application stats:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;