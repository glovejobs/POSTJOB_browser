'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, MapPin, Building, Briefcase, DollarSign, Clock,
  Filter, ChevronRight, Users, TrendingUp, Sparkles
} from 'lucide-react';
import { BRAND_CONFIG } from '@/shared/constants';
import { formatDistanceToNow } from 'date-fns';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  level: string;
  salary?: string;
  department?: string;
  description: string;
  createdAt: string;
  applicationCount: number;
}

export default function PublicJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    level: '',
    department: ''
  });
  const [stats, setStats] = useState({
    totalJobs: 0,
    companiesHiring: 0,
    newThisWeek: 0
  });

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.type) params.append('type', filters.type);
      if (filters.level) params.append('level', filters.level);
      if (filters.department) params.append('department', filters.department);

      const response = await fetch(`/api/jobs/public?${params}`);
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/jobs/public/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const jobLevels = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'];
  const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'HR'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#FF5A5F] to-[#FF7A7F] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Find Your Dream Job</h1>
            <p className="text-xl mb-8">
              Discover opportunities at top universities and institutions
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-xl p-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-0 focus:ring-0"
                />
              </div>
              <Button
                type="submit"
                style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
                size="lg"
              >
                Search Jobs
              </Button>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12">
              <div>
                <div className="text-3xl font-bold">{stats.totalJobs}+</div>
                <div className="text-sm opacity-90">Open Positions</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.companiesHiring}+</div>
                <div className="text-sm opacity-90">Companies Hiring</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.newThisWeek}</div>
                <div className="text-sm opacity-90">New This Week</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Jobs */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Job Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Job Type</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    <option value="">All Types</option>
                    {jobTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={filters.level}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                  >
                    <option value="">All Levels</option>
                    {jobLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Department</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFilters({ type: '', level: '', department: '' });
                    setSearchTerm('');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {searchTerm ? `Results for "${searchTerm}"` : 'All Jobs'}
              </h2>
              <span className="text-gray-600">{jobs.length} jobs found</span>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                  <p className="text-gray-600">Try adjusting your filters or search terms</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <Card
                    key={job.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                              <div className="flex items-center gap-4 text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                  <Building className="h-4 w-4" />
                                  {job.company}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.location}
                                </span>
                              </div>
                            </div>
                            {job.applicationCount > 10 && (
                              <Badge className="bg-green-100 text-green-800">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>

                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline">{job.type}</Badge>
                            <Badge variant="outline">{job.level}</Badge>
                            {job.department && <Badge variant="outline">{job.department}</Badge>}
                            {job.salary && (
                              <Badge variant="outline">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {job.salary}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                              </span>
                              {job.applicationCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {job.applicationCount} applicants
                                </span>
                              )}
                            </div>
                            <Button variant="ghost" size="sm">
                              View Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Companies */}
      <div className="bg-gray-50 py-12 mt-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Featured Universities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {['MIT', 'Harvard', 'Stanford', 'Yale', 'Princeton', 'Columbia'].map(uni => (
              <div key={uni} className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <p className="font-medium">{uni}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}