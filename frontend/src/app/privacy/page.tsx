'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BRAND_CONFIG } from '../../../../shared/constants';

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <div className="space-y-6" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              1. Information We Collect
            </h2>
            <p className="mb-3">
              We collect information you provide directly to us, such as when you create an account,
              post a job, or contact us for support.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (email, name, company)</li>
              <li>Job posting details</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, maintain, and improve our services</li>
              <li>To process job postings and payments</li>
              <li>To send you technical notices and updates</li>
              <li>To respond to your comments and questions</li>
              <li>To protect against fraud and abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              3. Information Sharing
            </h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties.
              We may share your information in the following situations:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>With job boards to publish your job postings</li>
              <li>With service providers who assist in our operations</li>
              <li>To comply with legal obligations</li>
              <li>With your consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              4. Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              5. Your Rights
            </h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              6. Cookies
            </h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our service and
              hold certain information. You can instruct your browser to refuse all cookies or to
              indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
              7. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              Email: privacy@{BRAND_CONFIG.name.toLowerCase()}.com
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