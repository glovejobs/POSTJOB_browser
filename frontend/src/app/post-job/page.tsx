'use client';

import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '@/../../shared/constants';
import PostJobForm from '@/components/PostJobForm';
import { ArrowLeft } from 'lucide-react';

export default function PostJobPage() {
  const router = useRouter();
  const { colors, typography } = BRAND_CONFIG;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.surface }}>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10" style={{ borderColor: colors.border }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:shadow-md"
            >
              <ArrowLeft size={20} style={{ color: colors.textSecondary }} />
            </button>

            <div>
              <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
                Post New Job
              </h1>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Fill out your job details and publish to multiple boards
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="card">
          <PostJobForm onSuccess={(jobId) => {
            // After job is created, redirect to job detail page
            router.push(`/job/${jobId}`);
          }} />
        </div>
      </div>
    </div>
  );
}