'use client';

import { useState, useEffect } from 'react';
import { Job } from '@/../../shared/types';
import { BRAND_CONFIG } from '@/../../shared/constants';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface MyJobsTableProps {
  initialJobs?: Job[];
  onJobClick: (job: Job) => void;
  onPostNewJob: () => void;
  onEditJob?: (job: Job) => void;
  onDeleteJob?: (jobId: string) => void;
}

export default function MyJobsTable({
  initialJobs = [],
  onJobClick,
  onPostNewJob,
  onEditJob,
  onDeleteJob
}: MyJobsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

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

    if (selectedStatus !== 'all') {
      const statusMap: Record<string, string[]> = {
        active: ['completed', 'posting'],
        draft: ['pending'],
        closed: ['failed']
      };
      const statuses = statusMap[selectedStatus] || [];
      if (!statuses.includes(job.status)) return false;
    }

    if (selectedDepartment !== 'all' && job.department !== selectedDepartment) {
      return false;
    }

    return true;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (!sortConfig) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    const { key, direction } = sortConfig;
    let aValue = a[key as keyof Job];
    let bValue = b[key as keyof Job];

    if (key === 'createdAt') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        label: 'Active',
        bgColor: `${BRAND_CONFIG.colors.success}20`,
        textColor: BRAND_CONFIG.colors.success
      },
      posting: {
        label: 'Publishing',
        bgColor: `${BRAND_CONFIG.colors.info}20`,
        textColor: BRAND_CONFIG.colors.info
      },
      failed: {
        label: 'Closed',
        bgColor: `${BRAND_CONFIG.colors.error}20`,
        textColor: BRAND_CONFIG.colors.error
      },
      pending: {
        label: 'Draft',
        bgColor: BRAND_CONFIG.colors.surface,
        textColor: BRAND_CONFIG.colors.gray
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span
        className="inline-flex px-2 py-1 text-xs font-medium"
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor,
          borderRadius: BRAND_CONFIG.borderRadius.full
        }}
      >
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

  const uniqueDepartments = Array.from(new Set(jobs.map(job => job.department).filter(Boolean)));

  return (
    <div className="bg-white shadow-sm" style={{ borderRadius: BRAND_CONFIG.borderRadius.card }}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">My Jobs</h1>
          <button
            onClick={onPostNewJob}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium transition-colors"
            style={{
              backgroundColor: BRAND_CONFIG.colors.primary,
              borderRadius: BRAND_CONFIG.borderRadius.button
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = BRAND_CONFIG.colors.primaryDark}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BRAND_CONFIG.colors.primary}
          >
            <PlusIcon className="w-4 h-4" />
            Post New Job
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{
                borderColor: BRAND_CONFIG.colors.border,
                borderRadius: BRAND_CONFIG.borderRadius.input,
                color: BRAND_CONFIG.colors.textPrimary
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border text-sm focus:outline-none focus:ring-2"
            style={{
              borderColor: BRAND_CONFIG.colors.border,
              borderRadius: BRAND_CONFIG.borderRadius.input,
              color: BRAND_CONFIG.colors.textPrimary
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>

          {/* Department Filter */}
          {uniqueDepartments.length > 0 && (
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border text-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: BRAND_CONFIG.colors.border,
                borderRadius: BRAND_CONFIG.borderRadius.input,
                color: BRAND_CONFIG.colors.textPrimary
              }}
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          )}

          {/* Filter Icon */}
          <button
            className="p-2 border hover:bg-gray-50 transition-colors"
            style={{
              borderColor: BRAND_CONFIG.colors.border,
              borderRadius: BRAND_CONFIG.borderRadius.button
            }}
          >
            <FunnelIcon className="w-5 h-5" style={{ color: BRAND_CONFIG.colors.gray }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Job Title
                  <ChevronUpDownIcon className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Status
                  <ChevronUpDownIcon className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('location')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Location
                  <ChevronUpDownIcon className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('department')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Department
                  <ChevronUpDownIcon className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Posted Date
                  <ChevronUpDownIcon className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-gray-500 text-sm mb-2">No jobs found</p>
                    <p className="text-gray-400 text-xs">
                      {searchQuery
                        ? "Try adjusting your search or filters"
                        : "Get started by posting your first job"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedJobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onJobClick(job)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.company}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(job.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{job.location || 'Remote'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{job.department || 'General'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{formatDate(job.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {job.applicationCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJobClick(job);
                        }}
                        className="p-1.5 hover:bg-blue-50 transition-colors"
                        style={{
                          color: BRAND_CONFIG.colors.gray,
                          borderRadius: BRAND_CONFIG.borderRadius.sm
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = BRAND_CONFIG.colors.secondary}
                        onMouseLeave={(e) => e.currentTarget.style.color = BRAND_CONFIG.colors.gray}
                        title="View"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {onEditJob && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditJob(job);
                          }}
                          className="p-1.5 hover:bg-blue-50 transition-colors"
                        style={{
                          color: BRAND_CONFIG.colors.gray,
                          borderRadius: BRAND_CONFIG.borderRadius.sm
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = BRAND_CONFIG.colors.secondary}
                        onMouseLeave={(e) => e.currentTarget.style.color = BRAND_CONFIG.colors.gray}
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteJob && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this job?')) {
                              onDeleteJob(job.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 transition-colors"
                          style={{
                            color: BRAND_CONFIG.colors.gray,
                            borderRadius: BRAND_CONFIG.borderRadius.sm
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = BRAND_CONFIG.colors.error}
                          onMouseLeave={(e) => e.currentTarget.style.color = BRAND_CONFIG.colors.gray}
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedJobs.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{' '}
              <span className="font-medium">{Math.min(10, sortedJobs.length)}</span> of{' '}
              <span className="font-medium">{sortedJobs.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: BRAND_CONFIG.colors.border,
                  borderRadius: BRAND_CONFIG.borderRadius.button,
                  color: BRAND_CONFIG.colors.textSecondary
                }}
                disabled
              >
                Previous
              </button>
              <button
                className="px-3 py-1 border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: BRAND_CONFIG.colors.border,
                  borderRadius: BRAND_CONFIG.borderRadius.button,
                  color: BRAND_CONFIG.colors.textSecondary
                }}
                disabled
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}