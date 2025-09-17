import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// SearchFilters and SortOptions interfaces removed as they're not used

// GET /api/search/jobs - Advanced job search
router.get('/jobs', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      q,
      status,
      employmentType,
      location,
      salaryMin,
      salaryMax,
      company,
      dateFrom,
      dateTo,
      hasApplications,
      boardId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { userId };

    // Text search
    if (q) {
      where.OR = [
        { title: { contains: q as string } },
        { description: { contains: q as string } },
        { company: { contains: q as string } },
        { location: { contains: q as string } }
      ];
    }

    // Status filter
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      where.status = { in: statuses };
    }

    // Employment type filter
    if (employmentType) {
      const types = Array.isArray(employmentType) ? employmentType : [employmentType];
      where.employmentType = { in: types };
    }

    // Location filter
    if (location) {
      const locations = Array.isArray(location) ? location : [location];
      where.location = { in: locations };
    }

    // Salary range filter
    if (salaryMin || salaryMax) {
      where.AND = where.AND || [];
      if (salaryMin) {
        where.AND.push({ salaryMax: { gte: parseInt(salaryMin as string) } });
      }
      if (salaryMax) {
        where.AND.push({ salaryMin: { lte: parseInt(salaryMax as string) } });
      }
    }

    // Company filter
    if (company) {
      const companies = Array.isArray(company) ? company : [company];
      where.company = { in: companies };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo as string);
      }
    }

    // Has applications filter
    if (hasApplications === 'true') {
      where.applications = { some: {} };
    } else if (hasApplications === 'false') {
      where.applications = { none: {} };
    }

    // Board filter
    if (boardId) {
      where.postings = {
        some: { boardId: boardId as string }
      };
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'title':
        orderBy = { title: sortOrder };
        break;
      case 'company':
        orderBy = { company: sortOrder };
        break;
      case 'salary':
        orderBy = { salaryMax: sortOrder };
        break;
      case 'applications':
        orderBy = { applications: { _count: sortOrder } };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    // Execute search with pagination
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          _count: {
            select: {
              applications: true,
              postings: true
            }
          },
          postings: {
            select: {
              board: { select: { name: true } },
              status: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    // Get facets for filtering
    const [statusFacets, typeFacets, locationFacets, companyFacets] = await Promise.all([
      prisma.job.groupBy({
        by: ['status'],
        where: { userId },
        _count: true
      }),
      prisma.job.groupBy({
        by: ['employmentType'],
        where: { userId, employmentType: { not: null } },
        _count: true
      }),
      prisma.job.groupBy({
        by: ['location'],
        where: { userId },
        _count: true
      }),
      prisma.job.groupBy({
        by: ['company'],
        where: { userId },
        _count: true
      })
    ]);

    return res.json({
      results: jobs.map(job => ({
        ...job,
        applicationCount: job._count.applications,
        postingCount: job._count.postings,
        boards: job.postings.map(p => p.board.name)
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      facets: {
        status: statusFacets.map(f => ({ value: f.status, count: f._count })),
        employmentType: typeFacets.map(f => ({ value: f.employmentType, count: f._count })),
        location: locationFacets.map(f => ({ value: f.location, count: f._count })),
        company: companyFacets.map(f => ({ value: f.company, count: f._count }))
      }
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    return res.status(500).json({ error: 'Failed to search jobs' });
  }
});

// GET /api/search/applications - Search applications
router.get('/applications', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      q,
      status,
      jobId,
      scoreMin,
      scoreMax,
      dateFrom,
      dateTo,
      hasPortfolio,
      hasLinkedIn,
      sortBy = 'appliedAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      job: { userId }
    };

    // Text search
    if (q) {
      where.OR = [
        { candidateName: { contains: q as string } },
        { candidateEmail: { contains: q as string } },
        { coverLetter: { contains: q as string } }
      ];
    }

    // Status filter
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      where.status = { in: statuses };
    }

    // Job filter
    if (jobId) {
      where.jobId = jobId;
    }

    // Score range filter
    if (scoreMin || scoreMax) {
      where.score = {};
      if (scoreMin) {
        where.score.gte = parseInt(scoreMin as string);
      }
      if (scoreMax) {
        where.score.lte = parseInt(scoreMax as string);
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.appliedAt = {};
      if (dateFrom) {
        where.appliedAt.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        where.appliedAt.lte = new Date(dateTo as string);
      }
    }

    // Portfolio filter
    if (hasPortfolio === 'true') {
      where.portfolio = { not: null };
    } else if (hasPortfolio === 'false') {
      where.portfolio = null;
    }

    // LinkedIn filter
    if (hasLinkedIn === 'true') {
      where.linkedIn = { not: null };
    } else if (hasLinkedIn === 'false') {
      where.linkedIn = null;
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'candidateName':
        orderBy = { candidateName: sortOrder };
        break;
      case 'score':
        orderBy = { score: sortOrder };
        break;
      case 'status':
        orderBy = { status: sortOrder };
        break;
      default:
        orderBy = { appliedAt: sortOrder };
    }

    // Execute search with pagination
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          job: {
            select: {
              title: true,
              company: true
            }
          },
          _count: {
            select: { communications: true }
          }
        }
      }),
      prisma.application.count({ where })
    ]);

    // Get facets
    const [statusFacets, jobFacets] = await Promise.all([
      prisma.application.groupBy({
        by: ['status'],
        where: { job: { userId } },
        _count: true
      }),
      prisma.application.findMany({
        where: { job: { userId } },
        select: {
          job: {
            select: { id: true, title: true }
          }
        },
        distinct: ['jobId']
      })
    ]);

    return res.json({
      results: applications.map(app => ({
        ...app,
        communicationCount: app._count.communications
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      facets: {
        status: statusFacets.map(f => ({ value: f.status, count: f._count })),
        jobs: jobFacets.map(f => ({ value: f.job.id, label: f.job.title }))
      }
    });
  } catch (error) {
    console.error('Error searching applications:', error);
    return res.status(500).json({ error: 'Failed to search applications' });
  }
});

// POST /api/search/saved - Save a search
router.post('/saved', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, type, filters, url } = req.body;

    if (!name || !type || !filters) {
      return res.status(400).json({ error: 'Name, type, and filters are required' });
    }

    // Store saved search in user's profile (using emailPreferences field temporarily)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse existing saved searches or initialize
    let savedSearches = [];
    try {
      if (user.emailPreferences) {
        const prefs = JSON.parse(user.emailPreferences);
        savedSearches = prefs.savedSearches || [];
      }
    } catch (e) {
      savedSearches = [];
    }

    // Add new search
    const newSearch = {
      id: `search_${Date.now()}`,
      name,
      type,
      filters,
      url,
      createdAt: new Date().toISOString()
    };

    savedSearches.push(newSearch);

    // Limit to 10 saved searches
    if (savedSearches.length > 10) {
      savedSearches = savedSearches.slice(-10);
    }

    // Update user preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailPreferences: JSON.stringify({
          ...JSON.parse(user.emailPreferences || '{}'),
          savedSearches
        })
      }
    });

    return res.json({
      message: 'Search saved successfully',
      search: newSearch
    });
  } catch (error) {
    console.error('Error saving search:', error);
    return res.status(500).json({ error: 'Failed to save search' });
  }
});

// GET /api/search/saved - Get saved searches
router.get('/saved', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailPreferences: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let savedSearches = [];
    try {
      if (user.emailPreferences) {
        const prefs = JSON.parse(user.emailPreferences);
        savedSearches = prefs.savedSearches || [];
      }
    } catch (e) {
      savedSearches = [];
    }

    return res.json(savedSearches);
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return res.status(500).json({ error: 'Failed to fetch saved searches' });
  }
});

// DELETE /api/search/saved/:id - Delete a saved search
router.delete('/saved/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const searchId = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let savedSearches = [];
    try {
      if (user.emailPreferences) {
        const prefs = JSON.parse(user.emailPreferences);
        savedSearches = prefs.savedSearches || [];
      }
    } catch (e) {
      savedSearches = [];
    }

    // Remove the search
    savedSearches = savedSearches.filter((s: any) => s.id !== searchId);

    // Update user preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailPreferences: JSON.stringify({
          ...JSON.parse(user.emailPreferences || '{}'),
          savedSearches
        })
      }
    });

    return res.json({ message: 'Search deleted successfully' });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return res.status(500).json({ error: 'Failed to delete search' });
  }
});

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { q, type = 'all' } = req.query;

    if (!q || (q as string).length < 2) {
      return res.json({ suggestions: [] });
    }

    const query = q as string;
    const suggestions: any[] = [];

    if (type === 'all' || type === 'jobs') {
      // Job title suggestions
      const jobTitles = await prisma.job.findMany({
        where: {
          userId,
          title: { contains: query }
        },
        select: { title: true },
        distinct: ['title'],
        take: 5
      });
      suggestions.push(...jobTitles.map(j => ({ type: 'job', value: j.title })));

      // Company suggestions
      const companies = await prisma.job.findMany({
        where: {
          userId,
          company: { contains: query }
        },
        select: { company: true },
        distinct: ['company'],
        take: 5
      });
      suggestions.push(...companies.map(c => ({ type: 'company', value: c.company })));
    }

    if (type === 'all' || type === 'applications') {
      // Candidate name suggestions
      const candidates = await prisma.application.findMany({
        where: {
          job: { userId },
          candidateName: { contains: query }
        },
        select: { candidateName: true },
        distinct: ['candidateName'],
        take: 5
      });
      suggestions.push(...candidates.map(c => ({ type: 'candidate', value: c.candidateName })));
    }

    return res.json({ suggestions: suggestions.slice(0, 10) });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;