'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, PenLine, Zap } from 'lucide-react';
import { BRAND_CONFIG } from '../../../../../shared/constants';

export default function NewJobPage() {
  const router = useRouter();
  const { colors, typography, shadows, borderRadius } = BRAND_CONFIG;
  const [jobTitle, setJobTitle] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      router.push('/dashboard?tab=jobs');
    }, 200);
  };

  const handleWriteManually = () => {
    if (!jobTitle.trim()) {
      alert('Please enter a job title');
      return;
    }
    router.push(`/job/new/manual-form?title=${encodeURIComponent(jobTitle)}`);
  };

  const handleAIAssisted = () => {
    if (!jobTitle.trim()) {
      alert('Please enter a job title');
      return;
    }
    router.push(`/job/new/ai-form?title=${encodeURIComponent(jobTitle)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ fontFamily: typography.fontFamily.primary }}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-50'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: colors.textSecondary }}
        >
          <X size={20} />
        </button>

        {/* Modal Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{
                   background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                   boxShadow: shadows.md
                 }}>
              <Sparkles size={32} className="text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Create a new job post
            </h2>

            {/* AI Badge */}
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                 style={{
                   backgroundColor: colors.primaryLight + '15',
                   color: colors.primary
                 }}>
              <Zap size={14} />
              <span className="font-medium">AI-powered job creation</span>
            </div>
          </div>

          {/* Job Title Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Job title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                borderColor: colors.border,
                fontSize: typography.fontSize.base
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = 'none';
              }}
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleWriteManually}
              className="w-full px-6 py-3 rounded-lg border-2 font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
              style={{
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.backgroundColor = colors.surface;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <PenLine size={18} />
              Write it myself
            </button>

            <button
              onClick={handleAIAssisted}
              className="w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              }}
            >
              <Sparkles size={18} />
              Start job post with AI
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-center text-sm mt-6" style={{ color: colors.textSecondary }}>
            You can always edit your job post later
          </p>
        </div>
      </div>
    </div>
  );
}