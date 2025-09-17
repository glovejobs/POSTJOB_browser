'use client';

import { useState, useEffect } from 'react';
import { Job } from '@/../../shared/types';
import { BRAND_CONFIG } from '@/../../shared/constants';
import {
  Search, Filter, MoreVertical, MapPin, Plus, Edit, Trash2, Copy
} from 'lucide-react';
import { SkeletonCard, SkeletonTable } from './ui/Skeleton';
import { ButtonLoader } from './ui/Loader';
import { StaggerAnimation } from './ui/PageTransition';
import { useApi, useMutation } from '@/hooks/useApi';
import { jobsApi } from '@/services/api';

interface MyJobsProps {
  initialJobs?: Job[];
  onJobClick: (job: Job) => void;
  onPostNewJob: () => void;
}

interface JobStats {
  new: number;
  interview: number;
  offered: number;
  hired: number;
  total: number;
}

export default function MyJobs({ initialJobs = [], onJobClick, onPostNewJob }: MyJobsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'closed' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [optimisticJobs, setOptimisticJobs] = useState<Job[]>(initialJobs);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Always use initial jobs from parent since parent is fetching
  useEffect(() => {
    setOptimisticJobs(initialJobs);
  }, [initialJobs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  // We don't fetch here since parent already fetches
  const loading = false;
  const error = null;
  const refetch = () => Promise.resolve();

  // Delete job mutation with optimistic update
  const deleteJobMutation = useMutation<void, string>(
    (jobId) => jobsApi.deleteJob(jobId),
    {
      onSuccess: () => refetch()
    }
  );

  const handleDeleteJob = async (jobId: string) => {
    // Optimistic update
    setOptimisticJobs(prev => prev.filter(job => job.id !== jobId));

    try {
      await deleteJobMutation.mutate(jobId);
    } catch (error) {
      // Revert on error
      refetch();
    }
  };

  const { colors, typography } = BRAND_CONFIG;

  // Filter jobs based on active filter
  const filteredJobs = (optimisticJobs || []).filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'open':
        return job.status === 'completed' || job.status === 'posting';
      case 'closed':
        return job.status === 'failed';
      case 'draft':
        return job.status === 'pending';
      default:
        return true;
    }
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
  });

  // Calculate stats for a job (mock data for now)
  const getJobStats = (job: Job): JobStats => {
    // In a real app, this would come from the job's applicant data
    return {
      new: job.status === 'completed' ? Math.floor(Math.random() * 5) : 0,
      interview: 0,
      offered: 0,
      hired: 0,
      total: job.status === 'completed' ? Math.floor(Math.random() * 5) : 0,
    };
  };

  // Calculate days ago
  const getDaysAgo = (date: Date | string | undefined) => {
    if (!date) return 'Unknown date';
    
    const jobDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - jobDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} Days ago`;
  };

  // Show skeleton loader while parent is loading
  if (initialJobs === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
            My jobs
          </h1>
          <p style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
            Stay on top of your job listings, connect with candidates, and keep your hiring process moving
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state when no jobs
  if (optimisticJobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
            My jobs
          </h1>
          <p style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
            Stay on top of your job listings, connect with candidates, and keep your hiring process moving
          </p>
        </div>
        <div className="text-center py-12">
          <p style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
            No jobs found. Create your first job listing!
          </p>
          <button
            onClick={onPostNewJob}
            className="mt-4 px-6 py-2 rounded-lg text-white"
            style={{
              backgroundColor: colors.primary,
              fontFamily: typography.fontFamily.primary
            }}
          >
            Post Your First Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
          My jobs
        </h1>
        <p style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
          Stay on top of your job listings, connect with candidates, and keep your hiring process moving
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['all', 'open', 'closed', 'draft'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 hover:shadow-md ${
                activeFilter === filter ? 'scale-105' : 'hover:scale-102'
              }`}
              style={{
                backgroundColor: activeFilter === filter ? colors.primary : 'transparent',
                color: activeFilter === filter ? 'white' : colors.textSecondary,
                border: activeFilter === filter ? 'none' : `1px solid ${colors.border}`,
                fontFamily: typography.fontFamily.primary
              }}
            >
              {filter} ({optimisticJobs.filter(j => {
                switch (filter) {
                  case 'open': return j.status === 'completed' || j.status === 'posting';
                  case 'closed': return j.status === 'failed';
                  case 'draft': return j.status === 'pending';
                  default: return true;
                }
              }).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: colors.textSecondary }} />
            <input
              type="text"
              placeholder="Search for jobs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-field px-3 py-2 text-sm"
            >
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {sortedJobs.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>No jobs found</p>
          </div>
        ) : (
          sortedJobs.map((job) => {
            const stats = getJobStats(job);
            const isOpen = job.status === 'completed' || job.status === 'posting';
            
            return (
              <div
                key={job.id}
                onClick={() => onJobClick(job)}
                className="card cursor-pointer hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
                        {job.title}
                      </h3>
                      <span className="text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
                        • {getDaysAgo(job.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
                      <span>{job.employmentType || 'Full time'} • {job.department || 'Remote'}</span>
                    </div>

                    <p className="mt-3 text-sm line-clamp-2" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
                      {job.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: isOpen ? `${colors.success}15` : `${colors.lightGray}15`,
                        color: isOpen ? colors.success : colors.textSecondary
                      }}
                    >
                      {isOpen ? 'Open' : 'Draft'}
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === job.id ? null : job.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical size={20} style={{ color: colors.textSecondary }} />
                      </button>

                      {activeDropdown === job.id && (
                        <div
                          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-1"
                          style={{ border: `1px solid ${colors.border}` }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onJobClick(job);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                            style={{ color: colors.textPrimary }}
                          >
                            <Edit size={16} />
                            Edit Job
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${window.location.origin}/jobs/${job.id}`);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                            style={{ color: colors.textPrimary }}
                          >
                            <Copy size={16} />
                            Copy Link
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this job?')) {
                                handleDeleteJob(job.id);
                              }
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                            style={{ color: colors.error }}
                          >
                            <Trash2 size={16} />
                            Delete Job
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>{stats.new}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>New</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>{stats.interview}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Interview</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>{stats.offered}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Offered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>{stats.hired}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Hired</div>
                  </div>
                  <div className="text-center px-4 py-1 rounded-full" style={{ backgroundColor: colors.surface }}>
                    <div className="text-2xl font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>{stats.total}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Total</div>
                  </div>
                </div>

                {/* Location */}
                {job.location && (
                  <div className="flex items-center gap-1 mt-4 text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
                    <MapPin size={16} />
                    <span>{job.location}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}