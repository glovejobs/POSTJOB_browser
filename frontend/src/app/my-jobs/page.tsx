'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '../../../../shared/constants';
import { jobs } from '@/lib/api';
import MyJobs from '@/components/MyJobs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Job } from '../../../../shared/types';

export default function MyJobsPage() {
  const router = useRouter();
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors, typography, shadows } = BRAND_CONFIG;

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobs.list();
      setUserJobs(data as Job[]);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
             style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
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
          jobs={userJobs}
          onJobClick={(job) => router.push(`/job/${job.id}`)}
          onPostNewJob={() => router.push('/job/new')}
        />
      </main>
    </div>
  );
}