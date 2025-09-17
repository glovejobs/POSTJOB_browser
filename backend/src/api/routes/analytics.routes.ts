import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { startOfWeek, subDays, subMonths } from 'date-fns';

const router = Router();
const prisma = new PrismaClient();

// GET /api/analytics/overview - Get overview statistics
router.get('/overview', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const [
      totalJobs,
      activeJobs,
      totalApplications,
      recentApplications,
      jobsByStatus,
      applicationsByStatus,
      conversionRate
    ] = await Promise.all([
      // Total jobs
      prisma.job.count({ where: { userId } }),

      // Active jobs (completed status = published)
      prisma.job.count({ where: { userId, status: 'completed' } }),

      // Total applications across all jobs
      prisma.application.count({
        where: { job: { userId } }
      }),

      // Applications in last 30 days
      prisma.application.count({
        where: {
          job: { userId },
          appliedAt: { gte: thirtyDaysAgo }
        }
      }),

      // Jobs by status
      prisma.job.groupBy({
        by: ['status'],
        where: { userId },
        _count: true
      }),

      // Applications by status
      prisma.application.groupBy({
        by: ['status'],
        where: { job: { userId } },
        _count: true
      }),

      // Conversion rate (hired / total applications)
      prisma.application.findMany({
        where: { job: { userId } },
        select: { status: true }
      })
    ]);

    const hiredCount = conversionRate.filter(a => a.status === 'hired').length;
    const conversionPercent = totalApplications > 0
      ? ((hiredCount / totalApplications) * 100).toFixed(2)
      : '0';

    return res.json({
      overview: {
        totalJobs,
        activeJobs,
        totalApplications,
        recentApplications,
        conversionRate: parseFloat(conversionPercent)
      },
      jobsByStatus: jobsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/trends - Get trend data over time
router.get('/trends', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { period = '30d' } = req.query;

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '12m':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subDays(now, 30);
    }

    // Get job postings over time
    const jobTrends = await prisma.job.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get applications over time
    const applicationTrends = await prisma.application.findMany({
      where: {
        job: { userId },
        appliedAt: { gte: startDate }
      },
      select: {
        appliedAt: true,
        status: true
      },
      orderBy: { appliedAt: 'asc' }
    });

    // Group by day for shorter periods, by week for longer
    const groupByInterval = period === '12m' ? 'month' : period === '90d' ? 'week' : 'day';

    return res.json({
      period,
      startDate,
      groupBy: groupByInterval,
      jobTrends: groupDataByInterval(jobTrends.map(j => ({
        date: j.createdAt,
        status: j.status
      })), groupByInterval),
      applicationTrends: groupDataByInterval(applicationTrends.map(a => ({
        date: a.appliedAt,
        status: a.status
      })), groupByInterval)
    });
  } catch (error) {
    console.error('Error fetching trend analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /api/analytics/performance - Get job performance metrics
router.get('/performance', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const jobs = await prisma.job.findMany({
      where: { userId },
      include: {
        _count: {
          select: { applications: true }
        },
        applications: {
          select: {
            status: true,
            score: true,
            appliedAt: true
          }
        },
        postings: {
          select: {
            board: { select: { name: true } },
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const performance = jobs.map(job => {
      const applicationCount = job._count.applications;
      const hiredCount = job.applications.filter(a => a.status === 'hired').length;
      const avgScore = job.applications.length > 0
        ? job.applications.reduce((sum, a) => sum + (a.score || 0), 0) / job.applications.length
        : 0;

      const timeToFirstApplication = job.applications.length > 0
        ? Math.floor((new Date(job.applications[0].appliedAt).getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60))
        : null;

      const successfulBoards = job.postings.filter(p => p.status === 'success').map(p => p.board.name);

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        status: job.status,
        createdAt: job.createdAt,
        metrics: {
          applications: applicationCount,
          hired: hiredCount,
          conversionRate: applicationCount > 0 ? ((hiredCount / applicationCount) * 100).toFixed(2) : '0',
          averageScore: avgScore.toFixed(1),
          timeToFirstApplication,
          successfulBoards
        }
      };
    });

    return res.json(performance);
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// GET /api/analytics/boards - Get job board performance
router.get('/boards', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const boardStats = await prisma.jobBoard.findMany({
      include: {
        postings: {
          where: {
            job: { userId }
          },
          include: {
            job: {
              include: {
                _count: {
                  select: { applications: true }
                }
              }
            }
          }
        }
      }
    });

    const boardPerformance = boardStats.map(board => {
      const successfulPostings = board.postings.filter(p => p.status === 'success').length;
      const totalPostings = board.postings.length;
      const successRate = totalPostings > 0
        ? ((successfulPostings / totalPostings) * 100).toFixed(2)
        : '0';

      const totalApplications = board.postings.reduce((sum, posting) => {
        return sum + posting.job._count.applications;
      }, 0);

      const avgApplicationsPerJob = successfulPostings > 0
        ? (totalApplications / successfulPostings).toFixed(1)
        : '0';

      return {
        id: board.id,
        name: board.name,
        enabled: board.enabled,
        stats: {
          totalPostings,
          successfulPostings,
          successRate: parseFloat(successRate),
          totalApplications,
          avgApplicationsPerJob: parseFloat(avgApplicationsPerJob)
        }
      };
    });

    return res.json(boardPerformance);
  } catch (error) {
    console.error('Error fetching board analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch board performance' });
  }
});

// GET /api/analytics/applicants - Get applicant analytics
router.get('/applicants', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const [
      topScorers,
      responseTime,
      sourceDiversity
    ] = await Promise.all([
      // Top scoring applicants
      prisma.application.findMany({
        where: {
          job: { userId },
          score: { not: null }
        },
        orderBy: { score: 'desc' },
        take: 10,
        include: {
          job: {
            select: {
              title: true,
              company: true
            }
          }
        }
      }),

      // Average response time by status
      prisma.application.findMany({
        where: {
          job: { userId },
          status: { not: 'new' }
        },
        select: {
          status: true,
          appliedAt: true,
          updatedAt: true
        }
      }),

      // Application sources (with/without portfolio, LinkedIn, etc.)
      prisma.application.findMany({
        where: { job: { userId } },
        select: {
          portfolio: true,
          linkedIn: true,
          coverLetter: true
        }
      })
    ]);

    // Calculate average response times
    const responseTimeByStatus = responseTime.reduce((acc, app) => {
      const responseHours = Math.floor(
        (new Date(app.updatedAt).getTime() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60)
      );

      if (!acc[app.status]) {
        acc[app.status] = { total: 0, count: 0 };
      }

      acc[app.status].total += responseHours;
      acc[app.status].count += 1;

      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const avgResponseTime = Object.entries(responseTimeByStatus).reduce((acc, [status, data]) => {
      acc[status] = Math.round(data.total / data.count);
      return acc;
    }, {} as Record<string, number>);

    // Calculate source diversity
    const withPortfolio = sourceDiversity.filter(a => a.portfolio).length;
    const withLinkedIn = sourceDiversity.filter(a => a.linkedIn).length;
    const withCoverLetter = sourceDiversity.filter(a => a.coverLetter).length;

    return res.json({
      topScorers: topScorers.map(a => ({
        id: a.id,
        candidateName: a.candidateName,
        candidateEmail: a.candidateEmail,
        score: a.score,
        status: a.status,
        job: a.job
      })),
      avgResponseTimeHours: avgResponseTime,
      applicationSources: {
        total: sourceDiversity.length,
        withPortfolio,
        withLinkedIn,
        withCoverLetter,
        portfolioRate: sourceDiversity.length > 0
          ? ((withPortfolio / sourceDiversity.length) * 100).toFixed(2)
          : '0',
        linkedInRate: sourceDiversity.length > 0
          ? ((withLinkedIn / sourceDiversity.length) * 100).toFixed(2)
          : '0',
        coverLetterRate: sourceDiversity.length > 0
          ? ((withCoverLetter / sourceDiversity.length) * 100).toFixed(2)
          : '0'
      }
    });
  } catch (error) {
    console.error('Error fetching applicant analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch applicant analytics' });
  }
});

// GET /api/analytics/export - Export analytics data
router.get('/export', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { format = 'json' } = req.query;

    // Fetch all data
    const [jobs, applications] = await Promise.all([
      prisma.job.findMany({
        where: { userId },
        include: {
          postings: {
            include: {
              board: true
            }
          },
          applications: true
        }
      }),
      prisma.application.findMany({
        where: { job: { userId } },
        include: {
          job: true,
          communications: true
        }
      })
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: req.user!.email,
      summary: {
        totalJobs: jobs.length,
        totalApplications: applications.length,
        totalHired: applications.filter(a => a.status === 'hired').length
      },
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        status: job.status,
        createdAt: job.createdAt,
        applications: job.applications.length,
        boards: job.postings.map(p => p.board.name)
      })),
      applications: applications.map(app => ({
        id: app.id,
        jobTitle: app.job.title,
        candidateName: app.candidateName,
        candidateEmail: app.candidateEmail,
        status: app.status,
        score: app.score,
        appliedAt: app.appliedAt
      }))
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = jsonToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.csv`);
      return res.send(csv);
    }

    // Default to JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.json`);
    return res.json(exportData);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return res.status(500).json({ error: 'Failed to export analytics' });
  }
});

// Helper function to group data by interval
function groupDataByInterval(data: Array<{ date: Date; status: string }>, interval: string) {
  const grouped: Record<string, any> = {};

  data.forEach(item => {
    let key: string;
    const date = new Date(item.date);

    switch (interval) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        key = startOfWeek(date).toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = { date: key, total: 0, byStatus: {} };
    }

    grouped[key].total += 1;
    grouped[key].byStatus[item.status] = (grouped[key].byStatus[item.status] || 0) + 1;
  });

  return Object.values(grouped);
}

// Helper function to convert JSON to CSV
function jsonToCSV(data: any): string {
  const jobs = data.jobs;
  const applications = data.applications;

  // Jobs CSV
  const jobHeaders = ['Job ID', 'Title', 'Company', 'Location', 'Status', 'Created', 'Applications', 'Boards'];
  const jobRows = jobs.map((job: any) => [
    job.id,
    job.title,
    job.company,
    job.location,
    job.status,
    job.createdAt,
    job.applications,
    job.boards.join(';')
  ]);

  // Applications CSV
  const appHeaders = ['Application ID', 'Job Title', 'Candidate Name', 'Email', 'Status', 'Score', 'Applied'];
  const appRows = applications.map((app: any) => [
    app.id,
    app.jobTitle,
    app.candidateName,
    app.candidateEmail,
    app.status,
    app.score || '',
    app.appliedAt
  ]);

  // Combine both CSVs
  const csv = [
    '=== JOBS ===',
    jobHeaders.join(','),
    ...jobRows.map((row: any[]) => row.join(',')),
    '',
    '=== APPLICATIONS ===',
    appHeaders.join(','),
    ...appRows.map((row: any[]) => row.join(','))
  ].join('\n');

  return csv;
}

export default router;