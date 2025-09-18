'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '../../../../shared/constants';
import MyJobsTable from '@/components/MyJobsTable';
import DashboardLayout from '@/components/DashboardLayout';
import { Job } from '../../../../shared/types';
import { useApi } from '@/hooks/useApi';
import { PageLoader } from '@/components/ui/Loader';

export default function MyJobsPage() {
  const router = useRouter();
  const { colors, typography, shadows } = BRAND_CONFIG;
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    const apiKey = localStorage.getItem('api_key');
    if (!apiKey) {
      router.push('/login');
    } else {
      setHasApiKey(true);
    }
  }, [router]);

  // Use optimized API hook with explicit immediate flag
  // Only make request if we have an API key
  const { data: userJobs, loading, error, refetch } = useApi<Job[]>(
    hasApiKey ? '/api/jobs' : null,
    {
      immediate: true,
      cache: false, // Disable cache for fresh data
      cacheDuration: 60000,
      retries: 1 // Add retry for better reliability
    }
  );

  // Fallback empty array if data is null
  const jobs = userJobs || [];

  // Always render the layout to keep sidebar/header stable
  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Show loading state only in content area */}
        {!hasApiKey || (loading && !userJobs) ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 animate-spin mx-auto rounded-full"></div>
              <p className="text-xs text-gray-500 mt-2">Loading your jobs...</p>
            </div>
          </div>
        ) : error && !userJobs ? (
          // Error state in content area
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg mb-4 text-red-600">
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
        ) : (
          // Jobs content
          <MyJobsTable
            initialJobs={jobs}
            onJobClick={(job) => router.push(`/job/${job.id}`)}
            onPostNewJob={() => router.push('/job/new')}
            onEditJob={(job) => router.push(`/job/${job.id}/edit`)}
            onDeleteJob={async (jobId) => {
              // Add delete functionality here
              console.log('Delete job:', jobId);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}