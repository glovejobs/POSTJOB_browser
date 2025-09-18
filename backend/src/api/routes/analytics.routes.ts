import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { startOfWeek, subDays, subMonths } from 'date-fns';
import db from '../../services/database.service';
import supabase from '../../database/supabase';

const router = Router();

// GET /api/analytics/stats - Get basic statistics for dashboard
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const stats = await db.job.getStats(userId);
    const { totalJobs, totalApplications } = stats;

    // Get active jobs count
    const { count: activeJobs } = await supabase
      .from('postjob_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['completed', 'posting']);

    const successRate = totalJobs > 0
      ? Math.round(((activeJobs || 0) / totalJobs) * 100)
      : 0;

    return res.json({
      totalJobs,
      activeJobs: activeJobs || 0,
      totalApplications,
      successRate
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/analytics/overview - Get overview statistics
router.get('/overview', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const stats = await db.job.getStats(userId);
    const { totalJobs, totalApplications } = stats;

    // Get active jobs (completed status = published)
    const { count: activeJobs } = await supabase
      .from('postjob_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Get user job IDs for application queries
    const { data: userJobs } = await supabase
      .from('postjob_jobs')
      .select('id')
      .eq('user_id', userId);

    const jobIds = userJobs?.map(j => j.id) || [];

    let recentApplications = 0;
    let jobsByStatus: any = {};
    let applicationsByStatus: any = {};
    let conversionRate: any = [];

    if (jobIds.length > 0) {
      // Applications in last 30 days
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id_link', jobIds)
        .gte('applied_at', thirtyDaysAgo.toISOString());
      recentApplications = count || 0;

      // Jobs by status
      const { data: jobStatusData } = await supabase
        .from('postjob_jobs')
        .select('status')
        .eq('user_id', userId);

      jobsByStatus = (jobStatusData || []).reduce((acc: any, job: any) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {});

      // Applications by status
      const { data: appStatusData } = await supabase
        .from('applications')
        .select('status')
        .in('job_id_link', jobIds);

      applicationsByStatus = (appStatusData || []).reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      // Conversion rate data
      const { data: conversionData } = await supabase
        .from('applications')
        .select('status')
        .in('job_id_link', jobIds);

      conversionRate = conversionData || [];
    }

    const hiredCount = conversionRate.filter((a: any) => a.status === 'hired').length;
    const conversionPercent = totalApplications > 0
      ? ((hiredCount / totalApplications) * 100).toFixed(2)
      : '0';

    return res.json({
      overview: {
        totalJobs,
        activeJobs: activeJobs || 0,
        totalApplications,
        recentApplications,
        conversionRate: parseFloat(conversionPercent)
      },
      jobsByStatus,
      applicationsByStatus
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
    const { data: jobTrends } = await supabase
      .from('postjob_jobs')
      .select('created_at, status')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Get user job IDs for application queries
    const { data: userJobs } = await supabase
      .from('postjob_jobs')
      .select('id')
      .eq('user_id', userId);

    const jobIds = userJobs?.map(j => j.id) || [];
    let applicationTrends: any = [];

    if (jobIds.length > 0) {
      const { data: appTrends } = await supabase
        .from('applications')
        .select('applied_at, status')
        .in('job_id_link', jobIds)
        .gte('applied_at', startDate.toISOString())
        .order('applied_at', { ascending: true });

      applicationTrends = appTrends || [];
    }

    // Group by day for shorter periods, by week for longer
    const groupByInterval = period === '12m' ? 'month' : period === '90d' ? 'week' : 'day';

    return res.json({
      period,
      startDate,
      groupBy: groupByInterval,
      jobTrends: groupDataByInterval((jobTrends || []).map(j => ({
        date: new Date(j.created_at),
        status: j.status
      })), groupByInterval),
      applicationTrends: groupDataByInterval(applicationTrends.map((a: any) => ({
        date: new Date(a.applied_at),
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

    const { data: jobs } = await supabase
      .from('postjob_jobs')
      .select(`
        *,
        applications(status, score, applied_at),
        postings:job_postings(status, board:job_boards(name))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const performance = (jobs || []).map((job: any) => {
      const applications = job.applications || [];
      const applicationCount = applications.length;
      const hiredCount = applications.filter((a: any) => a.status === 'hired').length;
      const avgScore = applications.length > 0
        ? applications.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / applications.length
        : 0;

      const timeToFirstApplication = applications.length > 0
        ? Math.floor((new Date(applications[0].applied_at).getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60))
        : null;

      const postings = job.postings || [];
      const successfulBoards = postings
        .filter((p: any) => p.status === 'success')
        .map((p: any) => p.board?.name)
        .filter(Boolean);

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        status: job.status,
        createdAt: job.created_at,
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

    const { data: boardStats } = await supabase
      .from('job_boards')
      .select(`
        *,
        postings:job_postings!inner(
          *,
          job:job_id_link(user_id)
        )
      `);

    // Filter postings by user and get application counts
    const filteredBoardStats = [];
    for (const board of boardStats || []) {
      const userPostings = board.postings.filter((p: any) => p.job.user_id === userId);

      // Get application counts for each job
      const postingsWithCounts = [];
      for (const posting of userPostings) {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', posting.job_id);

        postingsWithCounts.push({
          ...posting,
          job: {
            ...posting.job,
            _count: { applications: count || 0 }
          }
        });
      }

      if (postingsWithCounts.length > 0) {
        filteredBoardStats.push({
          ...board,
          postings: postingsWithCounts
        });
      }
    }

    const boardPerformance = filteredBoardStats.map((board: any) => {
      const successfulPostings = board.postings.filter((p: any) => p.status === 'success').length;
      const totalPostings = board.postings.length;
      const successRate = totalPostings > 0
        ? ((successfulPostings / totalPostings) * 100).toFixed(2)
        : '0';

      const totalApplications = board.postings.reduce((sum: number, posting: any) => {
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

    // Get user job IDs
    const { data: userJobs } = await supabase
      .from('postjob_jobs')
      .select('id')
      .eq('user_id', userId);

    const jobIds = userJobs?.map(j => j.id) || [];

    let topScorers: any = [];
    let responseTime: any = [];
    let sourceDiversity: any = [];

    if (jobIds.length > 0) {
      // Top scoring applicants
      const { data: topScorerData } = await supabase
        .from('applications')
        .select(`
          *,
          job:job_id_link(title, company)
        `)
        .in('job_id_link', jobIds)
        .not('score', 'is', null)
        .order('score', { ascending: false })
        .limit(10);
      topScorers = topScorerData || [];

      // Average response time by status
      const { data: responseTimeData } = await supabase
        .from('applications')
        .select('status, applied_at, updated_at')
        .in('job_id_link', jobIds)
        .neq('status', 'new');
      responseTime = responseTimeData || [];

      // Application sources
      const { data: sourceDiversityData } = await supabase
        .from('applications')
        .select('portfolio, linkedin_url, cover_letter')
        .in('job_id_link', jobIds);
      sourceDiversity = sourceDiversityData || [];
    }

    // Calculate average response times
    const responseTimeByStatus = responseTime.reduce((acc: any, app: any) => {
      const responseHours = Math.floor(
        (new Date(app.updated_at).getTime() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60)
      );

      if (!acc[app.status]) {
        acc[app.status] = { total: 0, count: 0 };
      }

      acc[app.status].total += responseHours;
      acc[app.status].count += 1;

      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const avgResponseTime = Object.entries(responseTimeByStatus).reduce((acc, [status, data]) => {
      acc[status] = Math.round((data as any).total / (data as any).count);
      return acc;
    }, {} as Record<string, number>);

    // Calculate source diversity
    const withPortfolio = sourceDiversity.filter((a: any) => a.portfolio).length;
    const withLinkedIn = sourceDiversity.filter((a: any) => a.linkedin_url).length;
    const withCoverLetter = sourceDiversity.filter((a: any) => a.cover_letter).length;

    return res.json({
      topScorers: topScorers.map((a: any) => ({
        id: a.id,
        candidateName: a.candidate_name,
        candidateEmail: a.candidate_email,
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
    const { data: jobs } = await supabase
      .from('postjob_jobs')
      .select(`
        *,
        postings:job_postings(
          *,
          board:job_boards(*)
        ),
        applications(*)
      `)
      .eq('user_id', userId);

    const { data: userJobIds } = await supabase
      .from('postjob_jobs')
      .select('id')
      .eq('user_id', userId);

    const jobIds = userJobIds?.map(j => j.id) || [];
    let applications: any = [];

    if (jobIds.length > 0) {
      const { data: appData } = await supabase
        .from('applications')
        .select(`
          *,
          job:job_id_link(*)
        `)
        .in('job_id_link', jobIds);
      applications = appData || [];
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      user: req.user!.email,
      summary: {
        totalJobs: (jobs || []).length,
        totalApplications: applications.length,
        totalHired: applications.filter((a: any) => a.status === 'hired').length
      },
      jobs: (jobs || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        status: job.status,
        createdAt: job.created_at,
        applications: (job.applications || []).length,
        boards: (job.postings || []).map((p: any) => p.board?.name).filter(Boolean)
      })),
      applications: applications.map((app: any) => ({
        id: app.id,
        jobTitle: app.job.title,
        candidateName: app.candidate_name,
        candidateEmail: app.candidate_email,
        status: app.status,
        score: app.score,
        appliedAt: app.applied_at
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
    (job.applications || []).length,
    (job.boards || []).join(';')
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