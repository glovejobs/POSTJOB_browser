import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import db from '../../services/database.service';
import supabase from '../../database/supabase';

const router = Router();

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

    // Start with basic user jobs query
    let query = supabase
      .from('postjob_jobs')
      .select(`
        *,
        postings:job_postings(
          status,
          board:job_boards(name)
        )
      `)
      .eq('user_id', userId);

    // Text search - using ilike for case-insensitive search
    if (q) {
      const searchTerm = `%${q}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},company.ilike.${searchTerm},location.ilike.${searchTerm}`);
    }

    // Status filter
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query = query.in('status', statuses);
    }

    // Employment type filter
    if (employmentType) {
      const types = Array.isArray(employmentType) ? employmentType : [employmentType];
      query = query.in('employment_type', types);
    }

    // Location filter
    if (location) {
      const locations = Array.isArray(location) ? location : [location];
      query = query.in('location', locations);
    }

    // Salary range filter
    if (salaryMin) {
      query = query.gte('salary_max', parseInt(salaryMin as string));
    }
    if (salaryMax) {
      query = query.lte('salary_min', parseInt(salaryMax as string));
    }

    // Company filter
    if (company) {
      const companies = Array.isArray(company) ? company : [company];
      query = query.in('company', companies);
    }

    // Date range filter
    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom as string).toISOString());
    }
    if (dateTo) {
      query = query.lte('created_at', new Date(dateTo as string).toISOString());
    }

    // Apply sorting
    switch (sortBy) {
      case 'title':
        query = query.order('title', { ascending: sortOrder === 'asc' });
        break;
      case 'company':
        query = query.order('company', { ascending: sortOrder === 'asc' });
        break;
      case 'salary':
        query = query.order('salary_max', { ascending: sortOrder === 'asc' });
        break;
      default:
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    query = query.range(skip, skip + limitNum - 1);

    // Execute search
    const { data: jobs, error } = await query;

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Failed to search jobs' });
    }

    // Get total count for pagination
    const { count: total } = await supabase
      .from('postjob_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Process results to add application counts and apply complex filters
    const processedJobs = [];
    for (const job of jobs || []) {
      // Get application count for each job
      const { count: appCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id_link', job.id);

      // Filter based on hasApplications if specified
      if (hasApplications === 'true' && (appCount || 0) === 0) continue;
      if (hasApplications === 'false' && (appCount || 0) > 0) continue;

      // Filter by board if specified
      if (boardId) {
        const { data: postings } = await supabase
          .from('job_postings')
          .select('board_id')
          .eq('job_id_link', job.id)
          .eq('board_id', boardId);
        if (!postings || postings.length === 0) continue;
      }

      processedJobs.push({
        ...job,
        applicationCount: appCount || 0,
        postingCount: (job.postings || []).length,
        boards: (job.postings || []).map((p: any) => p.board?.name).filter(Boolean)
      });
    }

    // Get facets for filtering
    const { data: allUserJobs } = await supabase
      .from('postjob_jobs')
      .select('status, employment_type, location, company')
      .eq('user_id', userId);

    // Calculate facets
    const statusFacets = (allUserJobs || []).reduce((acc: any, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    const typeFacets = (allUserJobs || []).reduce((acc: any, job: any) => {
      if (job.employment_type) {
        acc[job.employment_type] = (acc[job.employment_type] || 0) + 1;
      }
      return acc;
    }, {});

    const locationFacets = (allUserJobs || []).reduce((acc: any, job: any) => {
      if (job.location) {
        acc[job.location] = (acc[job.location] || 0) + 1;
      }
      return acc;
    }, {});

    const companyFacets = (allUserJobs || []).reduce((acc: any, job: any) => {
      if (job.company) {
        acc[job.company] = (acc[job.company] || 0) + 1;
      }
      return acc;
    }, {});

    return res.json({
      results: processedJobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limitNum),
        hasNext: pageNum * limitNum < (total || 0),
        hasPrev: pageNum > 1
      },
      facets: {
        status: Object.entries(statusFacets).map(([value, count]) => ({ value, count })),
        employmentType: Object.entries(typeFacets).map(([value, count]) => ({ value, count })),
        location: Object.entries(locationFacets).map(([value, count]) => ({ value, count })),
        company: Object.entries(companyFacets).map(([value, count]) => ({ value, count }))
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

    // Get user job IDs first
    const { data: userJobs } = await supabase
      .from('postjob_jobs')
      .select('id')
      .eq('user_id', userId);

    const jobIds = (userJobs || []).map(j => j.id);

    if (jobIds.length === 0) {
      return res.json({
        results: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        facets: { status: [], jobs: [] }
      });
    }

    // Build applications query
    let query = supabase
      .from('applications')
      .select(`
        *,
        job:job_id_link(title, company)
      `)
      .in('job_id_link', jobIds);

    // Text search
    if (q) {
      const searchTerm = `%${q}%`;
      query = query.or(`candidate_name.ilike.${searchTerm},candidate_email.ilike.${searchTerm},cover_letter.ilike.${searchTerm}`);
    }

    // Status filter
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query = query.in('status', statuses);
    }

    // Job filter
    if (jobId) {
      query = query.eq('job_id_link', jobId);
    }

    // Score range filter
    if (scoreMin) {
      query = query.gte('score', parseInt(scoreMin as string));
    }
    if (scoreMax) {
      query = query.lte('score', parseInt(scoreMax as string));
    }

    // Date range filter
    if (dateFrom) {
      query = query.gte('applied_at', new Date(dateFrom as string).toISOString());
    }
    if (dateTo) {
      query = query.lte('applied_at', new Date(dateTo as string).toISOString());
    }

    // Portfolio filter
    if (hasPortfolio === 'true') {
      query = query.not('portfolio', 'is', null);
    } else if (hasPortfolio === 'false') {
      query = query.is('portfolio', null);
    }

    // LinkedIn filter
    if (hasLinkedIn === 'true') {
      query = query.not('linkedin_url', 'is', null);
    } else if (hasLinkedIn === 'false') {
      query = query.is('linkedin_url', null);
    }

    // Apply sorting
    switch (sortBy) {
      case 'candidateName':
        query = query.order('candidate_name', { ascending: sortOrder === 'asc' });
        break;
      case 'score':
        query = query.order('score', { ascending: sortOrder === 'asc' });
        break;
      case 'status':
        query = query.order('status', { ascending: sortOrder === 'asc' });
        break;
      default:
        query = query.order('applied_at', { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    query = query.range(skip, skip + limitNum - 1);

    // Execute search
    const { data: applications, error } = await query;

    if (error) {
      console.error('Application search error:', error);
      return res.status(500).json({ error: 'Failed to search applications' });
    }

    // Get total count
    const { count: total } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('job_id_link', jobIds);

    // Get communication counts for each application
    const processedApplications = [];
    for (const app of applications || []) {
      const { count: commCount } = await supabase
        .from('application_communications')
        .select('*', { count: 'exact', head: true })
        .eq('application_id', app.id);

      processedApplications.push({
        ...app,
        communicationCount: commCount || 0
      });
    }

    // Get facets
    const { data: allApplications } = await supabase
      .from('applications')
      .select('status, job_id')
      .in('job_id_link', jobIds);

    const statusFacets = (allApplications || []).reduce((acc: any, app: any) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    // Get job facets
    const { data: jobFacets } = await supabase
      .from('postjob_jobs')
      .select('id, title')
      .eq('user_id', userId);

    return res.json({
      results: processedApplications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limitNum),
        hasNext: pageNum * limitNum < (total || 0),
        hasPrev: pageNum > 1
      },
      facets: {
        status: Object.entries(statusFacets).map(([value, count]) => ({ value, count })),
        jobs: (jobFacets || []).map(job => ({ value: job.id, label: job.title }))
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

    // Get user
    const user = await db.user.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse existing saved searches or initialize
    let savedSearches = [];
    try {
      if (user.email_preferences && typeof user.email_preferences === 'object') {
        savedSearches = (user.email_preferences as any).savedSearches || [];
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
    const currentPrefs = user.email_preferences || {};
    await db.user.update(userId, {
      emailPreferences: {
        ...currentPrefs,
        savedSearches
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

    const user = await db.user.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let savedSearches = [];
    try {
      if (user.email_preferences && typeof user.email_preferences === 'object') {
        savedSearches = (user.email_preferences as any).savedSearches || [];
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

    const user = await db.user.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let savedSearches = [];
    try {
      if (user.email_preferences && typeof user.email_preferences === 'object') {
        savedSearches = (user.email_preferences as any).savedSearches || [];
      }
    } catch (e) {
      savedSearches = [];
    }

    // Remove the search
    savedSearches = savedSearches.filter((s: any) => s.id !== searchId);

    // Update user preferences
    const currentPrefs = user.email_preferences || {};
    await db.user.update(userId, {
      emailPreferences: {
        ...currentPrefs,
        savedSearches
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
    const searchTerm = `%${query}%`;

    if (type === 'all' || type === 'jobs') {
      // Job title suggestions
      const { data: jobTitles } = await supabase
        .from('postjob_jobs')
        .select('title')
        .eq('user_id', userId)
        .ilike('title', searchTerm)
        .limit(5);

      const uniqueTitles = [...new Set((jobTitles || []).map(j => j.title))];
      suggestions.push(...uniqueTitles.map(title => ({ type: 'job', value: title })));

      // Company suggestions
      const { data: companies } = await supabase
        .from('postjob_jobs')
        .select('company')
        .eq('user_id', userId)
        .ilike('company', searchTerm)
        .not('company', 'is', null)
        .limit(5);

      const uniqueCompanies = [...new Set((companies || []).map(c => c.company))];
      suggestions.push(...uniqueCompanies.map(company => ({ type: 'company', value: company })));
    }

    if (type === 'all' || type === 'applications') {
      // Get user job IDs
      const { data: userJobs } = await supabase
        .from('postjob_jobs')
        .select('id')
        .eq('user_id', userId);

      const jobIds = (userJobs || []).map(j => j.id);

      if (jobIds.length > 0) {
        // Candidate name suggestions
        const { data: candidates } = await supabase
          .from('applications')
          .select('candidate_name')
          .in('job_id_link', jobIds)
          .ilike('candidate_name', searchTerm)
          .limit(5);

        const uniqueCandidates = [...new Set((candidates || []).map(c => c.candidate_name))];
        suggestions.push(...uniqueCandidates.map(name => ({ type: 'candidate', value: name })));
      }
    }

    return res.json({ suggestions: suggestions.slice(0, 10) });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;