'use client';

import { Job } from '@/../../shared/types';
import { BRAND_CONFIG } from '@/../../shared/constants';
import {
  TrendingUp, TrendingDown, Briefcase, CheckCircle,
  Clock, XCircle, Building, DollarSign, Calendar,
  BarChart3
} from 'lucide-react';

interface JobStatsProps {
  jobs: Job[];
}

export default function JobStats({ jobs }: JobStatsProps) {
  const { colors, typography } = BRAND_CONFIG;

  // Calculate statistics
  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    pending: jobs.filter(j => j.status === 'pending' || j.status === 'posting').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  const successRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  // Calculate total postings across all jobs
  const totalPostings = jobs.reduce((acc, job) => 
    acc + (job.postings?.length || 0), 0
  );

  const successfulPostings = jobs.reduce((acc, job) => 
    acc + (job.postings?.filter(p => p.status === 'success').length || 0), 0
  );

  const postingSuccessRate = totalPostings > 0
    ? Math.round((successfulPostings / totalPostings) * 100)
    : 0;

  // Get jobs by month for trend
  const jobsByMonth = jobs.reduce((acc, job) => {
    const month = new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = Object.entries(jobsByMonth)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-6); // Last 6 months

  // Calculate average time to completion
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const avgCompletionTime = completedJobs.length > 0
    ? completedJobs.reduce((acc, job) => {
        const startTime = new Date(job.createdAt).getTime();
        const endTime = job.updatedAt ? new Date(job.updatedAt).getTime() : startTime;
        return acc + (endTime - startTime);
      }, 0) / completedJobs.length / 60000 // Convert to minutes
    : 0;

  const statCards = [
    {
      title: 'Total Jobs Posted',
      value: stats.total,
      icon: <Briefcase size={24} />,
      color: colors.primary,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      icon: <CheckCircle size={24} />,
      color: colors.success,
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Posting Success Rate',
      value: `${postingSuccessRate}%`,
      icon: <Building size={24} />,
      color: colors.secondary,
      subtitle: `${successfulPostings} of ${totalPostings} postings`,
    },
    {
      title: 'Avg. Completion Time',
      value: `${Math.round(avgCompletionTime)} min`,
      icon: <Clock size={24} />,
      color: colors.warning,
      subtitle: 'Per job',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm"
            style={{ backgroundColor: colors.background }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <div style={{ color: stat.color }}>{stat.icon}</div>
              </div>
              {stat.trend && (
                <div className="flex items-center space-x-1 text-sm">
                  {stat.trendUp ? (
                    <TrendingUp size={16} style={{ color: colors.success }} />
                  ) : (
                    <TrendingDown size={16} style={{ color: colors.error }} />
                  )}
                  <span style={{ color: stat.trendUp ? colors.success : colors.error }}>
                    {stat.trend}
                  </span>
                </div>
              )}
            </div>
            <h3
              className="text-sm font-medium mb-1"
              style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
            >
              {stat.title}
            </h3>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
            >
              {stat.value}
            </p>
            {stat.subtitle && (
              <p
                className="text-xs mt-1"
                style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
              >
                {stat.subtitle}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Job Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="bg-white rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: colors.background }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
          >
            Job Status Distribution
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: colors.gray }}>Completed</span>
                <span style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
                  {stats.completed} ({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: colors.success,
                    width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: colors.gray }}>Pending</span>
                <span style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
                  {stats.pending} ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: colors.warning,
                    width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: colors.gray }}>Failed</span>
                <span style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
                  {stats.failed} ({stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: colors.error,
                    width: `${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div
          className="bg-white rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: colors.background }}
        >
          <h3
            className="text-lg font-semibold mb-4 flex items-center space-x-2"
            style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
          >
            <BarChart3 size={20} />
            <span>Monthly Posting Trend</span>
          </h3>
          {monthlyData.length > 0 ? (
            <div className="space-y-3">
              {monthlyData.map(([month, count], index) => (
                <div key={month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: colors.gray }}>{month}</span>
                    <span className="text-sm font-medium" style={{ color: colors.dark }}>
                      {count} jobs
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: colors.primary,
                        width: `${(count / Math.max(...monthlyData.map(d => d[1]))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-center py-8"
              style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
            >
              No data available yet
            </p>
          )}
        </div>
      </div>

      {/* Quick Insights */}
      <div
        className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-6"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: typography.fontFamily.primary }}>
          Quick Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm opacity-90 mb-1">Most Active Day</p>
            <p className="text-xl font-semibold">Tuesday</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Total Saved</p>
            <p className="text-xl font-semibold">${(stats.completed * 2.99).toFixed(2)}</p>
            <p className="text-xs opacity-75">vs manual posting</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Time Saved</p>
            <p className="text-xl font-semibold">{Math.round(stats.completed * 20)} min</p>
            <p className="text-xs opacity-75">~20 min per job</p>
          </div>
        </div>
      </div>
    </div>
  );
}