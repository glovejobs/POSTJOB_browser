'use client';

import { useState } from 'react';
import { Job } from '@/../../shared/types';
import { BRAND_CONFIG } from '@/../../shared/constants';
import {
  Clock, CheckCircle, XCircle, AlertCircle, 
  ExternalLink, RefreshCw, ChevronRight, Building,
  Calendar, MapPin, DollarSign, Briefcase
} from 'lucide-react';

interface JobsListProps {
  jobs: Job[];
  onRefresh: () => Promise<void>;
  onViewDetails: (jobId: string) => void;
}

export default function JobsList({ jobs, onRefresh, onViewDetails }: JobsListProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const { colors, typography } = BRAND_CONFIG;

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} style={{ color: colors.success }} />;
      case 'pending':
      case 'posting':
        return <Clock size={20} style={{ color: colors.warning }} />;
      case 'failed':
        return <XCircle size={20} style={{ color: colors.error }} />;
      default:
        return <AlertCircle size={20} style={{ color: colors.gray }} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: { bg: `${colors.success}15`, text: colors.success },
      pending: { bg: `${colors.warning}15`, text: colors.warning },
      posting: { bg: `${colors.secondary}15`, text: colors.secondary },
      failed: { bg: `${colors.error}15`, text: colors.error },
    };

    const { bg, text } = statusColors[status as keyof typeof statusColors] || statusColors.pending;

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-medium capitalize"
        style={{ backgroundColor: bg, color: text, fontFamily: typography.fontFamily.primary }}
      >
        {status}
      </span>
    );
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'pending') return job.status === 'pending' || job.status === 'posting';
    return job.status === filter;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {['all', 'completed', 'pending', 'failed'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterType ? 'bg-opacity-10' : ''
                }`}
                style={{
                  backgroundColor: filter === filterType ? colors.primary : 'transparent',
                  color: filter === filterType ? colors.primary : colors.gray,
                  fontFamily: typography.fontFamily.primary
                }}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                {filterType !== 'all' && (
                  <span className="ml-2">
                    ({jobs.filter(job => {
                      if (filterType === 'pending') return job.status === 'pending' || job.status === 'posting';
                      return job.status === filterType;
                    }).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: colors.surface,
            color: colors.gray,
            fontFamily: typography.fontFamily.primary
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Jobs List */}
      {sortedJobs.length === 0 ? (
        <div
          className="bg-white rounded-xl p-12 text-center"
          style={{ backgroundColor: colors.background }}
        >
          <div className="mb-4">
            <Briefcase size={48} style={{ color: colors.lightGray }} className="mx-auto" />
          </div>
          <h3
            className="text-lg font-medium mb-2"
            style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
          >
            No jobs found
          </h3>
          <p style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}>
            {filter === 'all' 
              ? "You haven't posted any jobs yet. Click 'Post New Job' to get started!"
              : `No ${filter} jobs found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onViewDetails(job.id)}
              style={{ backgroundColor: colors.background }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(job.status)}
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
                      >
                        {job.title}
                      </h3>
                      {getStatusBadge(job.status)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: colors.gray }}>
                      <div className="flex items-center space-x-1">
                        <Building size={14} />
                        <span>{job.company}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {(job.salaryMin || job.salaryMax) && (
                        <div className="flex items-center space-x-1">
                          <DollarSign size={14} />
                          <span>
                            {job.salaryMin && job.salaryMax
                              ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                              : job.salaryMin
                              ? `From $${job.salaryMin.toLocaleString()}`
                              : `Up to $${job.salaryMax?.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight size={24} style={{ color: colors.gray }} className="flex-shrink-0 ml-4" />
                </div>

                {/* Job Postings Summary */}
                {job.postings && job.postings.length > 0 && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <span style={{ color: colors.gray }}>Posted to:</span>
                        <div className="flex items-center space-x-2">
                          <span style={{ color: colors.success }}>
                            {job.postings.filter(p => p.status === 'success').length} successful
                          </span>
                          {job.postings.filter(p => p.status === 'pending' || p.status === 'posting').length > 0 && (
                            <span style={{ color: colors.warning }}>
                              • {job.postings.filter(p => p.status === 'pending' || p.status === 'posting').length} pending
                            </span>
                          )}
                          {job.postings.filter(p => p.status === 'failed').length > 0 && (
                            <span style={{ color: colors.error }}>
                              • {job.postings.filter(p => p.status === 'failed').length} failed
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {job.status === 'completed' && (
                        <span className="text-sm flex items-center space-x-1" style={{ color: colors.secondary }}>
                          <ExternalLink size={14} />
                          <span>View details</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}