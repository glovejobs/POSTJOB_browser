import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { io } from '../../index';
import { emailService } from '../../services/email.service';

const router = Router();
const prisma = new PrismaClient();

// GET /api/applications/job/:jobId - Get applications for a specific job
router.get('/job/:jobId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    // Verify job ownership
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      orderBy: { appliedAt: 'desc' },
      include: {
        communications: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      }
    });

    return res.json(applications);
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

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        communications: {
          orderBy: { sentAt: 'desc' }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify job ownership
    if (application.job.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return res.json(application);
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
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { user: true }
    });

    if (!job || job.status !== 'completed') {
      return res.status(404).json({ error: 'Job not found or not accepting applications' });
    }

    // Check for duplicate application
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId,
        candidateEmail
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this position' });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateName,
        candidateEmail,
        candidatePhone,
        resumeUrl,
        coverLetter,
        portfolio,
        linkedIn
      }
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
      if (job.user.email) {
        await emailService.sendNewApplicationNotification(job.user.email, {
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
    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.job.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update application
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        notes: notes || application.notes
      }
    });

    // Send email notification to candidate for important status changes
    if (['interview', 'rejected', 'hired'].includes(status)) {
      try {
        await emailService.sendApplicationStatusUpdate(application.candidateEmail, {
          candidateName: application.candidateName,
          jobTitle: application.job.title,
          company: application.job.company,
          status
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    // Emit socket event
    io.to(`job-${application.jobId}`).emit('application-updated', updatedApplication);

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
    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.job.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update score
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { score }
    });

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
    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.job.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create communication record
    const communication = await prisma.applicationCommunication.create({
      data: {
        applicationId: id,
        subject,
        message,
        direction: 'outbound'
      }
    });

    // Send email to applicant
    try {
      await emailService.sendApplicantCommunication(application.candidateEmail, {
        candidateName: application.candidateName,
        subject,
        message,
        jobTitle: application.job.title,
        company: application.job.company
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
    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.job.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete application
    await prisma.application.delete({
      where: { id }
    });

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
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get statistics
    const [statusCounts, totalCount, avgScore] = await Promise.all([
      prisma.application.groupBy({
        by: ['status'],
        where: { jobId },
        _count: true
      }),
      prisma.application.count({
        where: { jobId }
      }),
      prisma.application.aggregate({
        where: { jobId, score: { not: null } },
        _avg: { score: true }
      })
    ]);

    const stats = {
      total: totalCount,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      averageScore: avgScore._avg.score || 0
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching application stats:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;