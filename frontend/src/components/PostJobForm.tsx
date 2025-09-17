'use client';

import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '@/../../shared/constants';
import { Plus, ArrowRight, Sparkles, Target, Users, TrendingUp, Zap } from 'lucide-react';

interface PostJobFormProps {
  onSuccess?: (jobId: string) => void;
}

export default function PostJobForm({ onSuccess }: PostJobFormProps) {
  const router = useRouter();
  const { colors, typography, shadows, borderRadius } = BRAND_CONFIG;

  const handleStartPosting = () => {
    router.push('/job/new');
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8">
        <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6"
             style={{
               background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
               boxShadow: shadows.lg,
               borderRadius: borderRadius.full
             }}>
          <Sparkles size={40} className="text-white" />
        </div>

        <h2 className="text-3xl font-bold mb-3"
            style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
          Post Your Job in Minutes
        </h2>

        <p className="text-lg mb-8 max-w-2xl mx-auto"
           style={{ color: colors.textSecondary }}>
          Reach thousands of qualified candidates from top universities with our streamlined posting process.
        </p>

        <button
          onClick={handleStartPosting}
          className="inline-flex items-center px-8 py-4 text-white font-medium transition-all transform hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            boxShadow: shadows.md,
            fontSize: typography.fontSize.lg,
            borderRadius: borderRadius.card
          }}
        >
          <Plus size={20} className="mr-2" />
          Start Posting Now
          <ArrowRight size={20} className="ml-2" />
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 text-center"
             style={{ backgroundColor: colors.primaryLight + '10', border: `1px solid ${colors.primaryLight + '30'}`, borderRadius: borderRadius.card }}>
          <Target size={32} style={{ color: colors.primary }} className="mx-auto mb-3" />
          <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>
            Multi-Board Posting
          </h4>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Post to Harvard, MIT, Stanford, Yale, Princeton and more
          </p>
        </div>

        <div className="p-6 text-center"
             style={{ backgroundColor: colors.secondaryLight + '10', border: `1px solid ${colors.secondaryLight + '30'}`, borderRadius: borderRadius.card }}>
          <Zap size={32} style={{ color: colors.secondary }} className="mx-auto mb-3" />
          <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>
            Instant Publishing
          </h4>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Your job goes live immediately after payment
          </p>
        </div>

        <div className="p-6 text-center"
             style={{ backgroundColor: colors.success + '10', border: `1px solid ${colors.success + '30'}`, borderRadius: borderRadius.card }}>
          <TrendingUp size={32} style={{ color: colors.success }} className="mx-auto mb-3" />
          <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>
            Track Performance
          </h4>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Real-time updates on posting status
          </p>
        </div>
      </div>

      {/* Process Steps */}
      <div className="p-6" style={{ backgroundColor: colors.surface, borderRadius: borderRadius.card }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
          How It Works
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center text-white font-medium"
                 style={{ backgroundColor: colors.primary, borderRadius: borderRadius.full }}>
              1
            </div>
            <p className="ml-3 text-sm" style={{ color: colors.textSecondary }}>
              Fill in your job details using our intuitive form
            </p>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center text-white font-medium"
                 style={{ backgroundColor: colors.primary, borderRadius: borderRadius.full }}>
              2
            </div>
            <p className="ml-3 text-sm" style={{ color: colors.textSecondary }}>
              Select target university job boards
            </p>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center text-white font-medium"
                 style={{ backgroundColor: colors.primary, borderRadius: borderRadius.full }}>
              3
            </div>
            <p className="ml-3 text-sm" style={{ color: colors.textSecondary }}>
              Complete payment ($2.99 per board)
            </p>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center text-white font-medium"
                 style={{ backgroundColor: colors.success, borderRadius: borderRadius.full }}>
              ✓
            </div>
            <p className="ml-3 text-sm" style={{ color: colors.textSecondary }}>
              Your job is automatically posted to all selected boards!
            </p>
          </div>
        </div>
      </div>

      {/* Alternative Action */}
      <div className="text-center pt-4">
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          Want to see it in action first?
        </p>
        <button
          onClick={() => router.push('/demo')}
          className="inline-flex items-center px-6 py-2 border transition-colors hover:bg-gray-50"
          style={{
            borderColor: colors.border,
            color: colors.textPrimary,
            borderRadius: borderRadius.button
          }}
        >
          Watch Demo
          <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}