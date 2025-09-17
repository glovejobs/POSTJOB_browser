import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// GET /api/jobs/public - Get all public jobs
router.get('/public', async (req: Request, res: Response) => {
  try {
    const { search, type, level, department } = req.query;

    const where: any = {
      status: 'active',
      visibility: 'public'
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (type) where.type = type;
    if (level) where.level = level;
    if (department) where.department = department;

    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        type: true,
        level: true,
        salary: true,
        department: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedJobs = jobs.map(job => ({
      ...job,
      applicationCount: job._count.applications,
      _count: undefined
    }));

    return res.json(formattedJobs);
  } catch (error) {
    console.error('Error fetching public jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/public/stats - Get job statistics
router.get('/public/stats', async (_req: Request, res: Response) => {
  try {
    const totalJobs = await prisma.job.count({
      where: {
        status: 'active',
        visibility: 'public'
      }
    });

    const companiesHiring = await prisma.job.groupBy({
      by: ['company'],
      where: {
        status: 'active',
        visibility: 'public'
      }
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const newThisWeek = await prisma.job.count({
      where: {
        status: 'active',
        visibility: 'public',
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    return res.json({
      totalJobs,
      companiesHiring: companiesHiring.length,
      newThisWeek
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/jobs/public/:id - Get job details
router.get('/public/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findFirst({
      where: {
        id,
        status: 'active',
        visibility: 'public'
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        type: true,
        level: true,
        salary: true,
        department: true,
        description: true,
        requirements: true,
        benefits: true,
        createdAt: true,
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const formattedJob = {
      ...job,
      applicationCount: job._count.applications,
      _count: undefined
    };

    return res.json(formattedJob);
  } catch (error) {
    console.error('Error fetching job details:', error);
    return res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

// POST /api/applications/submit - Submit job application
router.post('/submit', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const { jobId, name, email, phone, linkedin, portfolio, coverLetter } = req.body;
    const resumeFile = req.file;

    if (!jobId || !name || !email || !coverLetter || !resumeFile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if job exists and is active
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        status: 'active',
        visibility: 'public'
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not accepting applications' });
    }

    // Check for duplicate application
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId,
        candidateEmail: email
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this position' });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateName: name,
        candidateEmail: email,
        candidatePhone: phone,
        linkedinUrl: linkedin,
        portfolioUrl: portfolio,
        coverLetter,
        resumeUrl: `/uploads/resumes/${resumeFile.filename}`,
        status: 'new',
        metadata: {
          appliedAt: new Date().toISOString(),
          source: 'public_board'
        }
      }
    });

    // Send confirmation email (if email service is configured)
    // await emailService.sendApplicationConfirmation(email, name, job.title);

    return res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application.id
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
});

// GET /api/applications/track/:email - Track application status
router.get('/track/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const applications = await prisma.application.findMany({
      where: {
        candidateEmail: email
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        job: {
          select: {
            title: true,
            company: true,
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (applications.length === 0) {
      return res.status(404).json({ error: 'No applications found for this email' });
    }

    return res.json(applications);
  } catch (error) {
    console.error('Error tracking applications:', error);
    return res.status(500).json({ error: 'Failed to track applications' });
  }
});

export default router;