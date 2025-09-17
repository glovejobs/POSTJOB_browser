'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '../../../../shared/constants';
import MyJobs from '@/components/MyJobs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Job } from '../../../../shared/types';
import { useApi } from '@/hooks/useApi';
import { PageLoader } from '@/components/ui/Loader';

export default function MyJobsPage() {
  const router = useRouter();
  const { colors, typography, shadows } = BRAND_CONFIG;

  // Use optimized API hook with explicit immediate flag
  const { data: userJobs, loading, error, refetch } = useApi<Job[]>(
    '/api/jobs',
    {
      immediate: true,
      cache: false, // Disable cache for fresh data
      cacheDuration: 60000,
      retries: 1 // Add retry for better reliability
    }
  );

  // Fallback empty array if data is null
  const jobs = userJobs || [];

  if (loading && !userJobs) {
    return <PageLoader text="Loading your jobs..." />;
  }

  // Handle error state
  if (error && !userJobs) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: colors.error }}>
            Failed to load jobs
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 rounded-lg text-white"
            style={{ backgroundColor: colors.primary }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.surface, fontFamily: typography.fontFamily.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4"
              style={{ borderColor: colors.border, backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: colors.textPrimary }}
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>
              My Jobs
            </h1>
          </div>

          <Link
            href="/job/new"
            className="px-4 py-2 rounded-lg text-white"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: shadows.sm
            }}
          >
            Post New Job
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        <MyJobs
          initialJobs={jobs}
          onJobClick={(job) => router.push(`/job/${job.id}`)}
          onPostNewJob={() => router.push('/job/new')}
        />
      </main>
    </div>
  );
}