'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BRAND_CONFIG } from '../../../../../../shared/constants';
import StatusDashboard from '@/components/StatusDashboard';

export default function JobStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { colors, typography } = BRAND_CONFIG;
  const jobId = params.id as string;

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
              Job Posting Status
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/my-jobs"
              className="px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: colors.border, color: colors.textPrimary }}
            >
              My Jobs
            </Link>
            <Link
              href="/job/new"
              className="px-4 py-2 rounded-lg text-white"
              style={{
                backgroundColor: colors.primary,
              }}
            >
              Post Another Job
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        <StatusDashboard jobId={jobId} />
      </main>
    </div>
  );
}