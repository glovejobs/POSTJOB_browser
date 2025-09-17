'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BRAND_CONFIG } from '../../../../shared/constants';

export default function TermsPage() {
  const router = useRouter();
  const { colors, typography } = BRAND_CONFIG;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.surface }}>
      <div className="max-w-4xl mx-auto p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-8 text-sm hover:underline"
          style={{ color: colors.primary }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-3xl font-bold mb-6" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
          Terms of Service
        </h1>

        <div className="space-y-6" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using {BRAND_CONFIG.name}, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              2. Use License
            </h2>
            <p>
              Permission is granted to temporarily use {BRAND_CONFIG.name} for personal, non-commercial transitory viewing only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              3. Job Posting Guidelines
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All job postings must be legitimate and lawful</li>
              <li>No discriminatory content is allowed</li>
              <li>Accurate company and job information must be provided</li>
              <li>Spam or duplicate postings are prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              4. Payment Terms
            </h2>
            <p>
              Job postings are subject to our current pricing. Payment is required before posts are published to job boards.
              Refunds are available within 24 hours if the job has not been posted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              5. Limitation of Liability
            </h2>
            <p>
              {BRAND_CONFIG.name} shall not be liable for any damages arising out of the use or inability to use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              6. Contact Information
            </h2>
            <p>
              For questions about these Terms of Service, please contact us at support@{BRAND_CONFIG.name.toLowerCase()}.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t" style={{ borderColor: colors.border }}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}