'use client';

import { useState, useEffect } from 'react';
import { Job } from '@/../../shared/types';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilSquareIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

interface MyJobsRedesignProps {
  initialJobs?: Job[];
  onJobClick: (job: Job) => void;
  onPostNewJob: () => void;
}

export default function MyJobsRedesign({
  initialJobs = [],
  onJobClick,
  onPostNewJob
}: MyJobsRedesignProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'active':
        return job.status === 'completed' || job.status === 'posting';
      case 'draft':
        return job.status === 'pending';
      case 'closed':
        return job.status === 'failed';
      default:
        return true;
    }
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'posting':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-amber-600" />;
      default:
        return <ExclamationCircleIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Active', className: 'bg-green-50 text-green-700 border-green-200' },
      posting: { label: 'Publishing', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      failed: { label: 'Closed', className: 'bg-red-50 text-red-700 border-red-200' },
      pending: { label: 'Draft', className: 'bg-gray-50 text-gray-700 border-gray-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filterCounts = {
    all: jobs.length,
    active: jobs.filter(j => j.status === 'completed' || j.status === 'posting').length,
    draft: jobs.filter(j => j.status === 'pending').length,
    closed: jobs.filter(j => j.status === 'failed').length
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all your job postings
            </p>
          </div>
          <button
            onClick={onPostNewJob}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Create Job
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {(['all', 'active', 'draft', 'closed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-all relative ${
                activeFilter === filter
                  ? 'text-blue-600 border-b-2 border-blue-600 -mb-[2px]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter}
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {filterCounts[filter]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Advanced Filters (if shown) */}
        {showFilters && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm">
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employment Type</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm">
                  <option>All Types</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm">
                  <option>All Locations</option>
                  <option>Remote</option>
                  <option>On-site</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Posted</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm">
                  <option>All Time</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Jobs Grid */}
      {sortedJobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery
              ? "Try adjusting your search or filters"
              : "Get started by creating your first job posting"}
          </p>
          {!searchQuery && (
            <button
              onClick={onPostNewJob}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              Create Your First Job
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onJobClick(job)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {job.title}
                      </h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BuildingOfficeIcon className="w-4 h-4" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {job.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        Posted {formatDate(job.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative group">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle dropdown menu
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <EllipsisHorizontalIcon className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {job.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <UsersIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {job.applicationCount || 0} Applications
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ChartBarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {job.views || 0} Views
                    </span>
                  </div>
                  {job.employmentType && (
                    <div className="flex items-center gap-2 text-sm">
                      <BriefcaseIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {job.employmentType}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}