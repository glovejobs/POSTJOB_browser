'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '@/../../shared/constants';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors, typography } = BRAND_CONFIG;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setEmailSent(true);
    } catch (err: any) {
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.surface }}>
        <div className="max-w-md w-full">
          <div
            className="rounded-xl shadow-lg p-8 text-center"
            style={{ backgroundColor: colors.background }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${colors.success}15` }}
            >
              <CheckCircle size={40} style={{ color: colors.success }} />
            </div>

            <h1
              className="text-2xl font-bold mb-4"
              style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
            >
              Check Your Email
            </h1>

            <p
              className="mb-6 leading-relaxed"
              style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
            >
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and follow the instructions to reset your password.
            </p>

            <div
              className="p-4 rounded-lg mb-6"
              style={{ backgroundColor: colors.surface }}
            >
              <p
                className="text-sm"
                style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}
              >
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="font-semibold underline"
                  style={{ color: colors.primary }}
                >
                  try again
                </button>
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-center space-x-2 font-medium"
              style={{ color: colors.primary }}
            >
              <ArrowLeft size={20} />
              <span style={{ fontFamily: typography.fontFamily.primary }}>
                Back to Login
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.surface }}>
      <div className="max-w-md w-full">
        <div
          className="rounded-xl shadow-lg p-8"
          style={{ backgroundColor: colors.background }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Mail className="h-8 w-8 text-white" />
            </div>

            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
            >
              Forgot Your Password?
            </h1>

            <p
              className="text-sm"
              style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
            >
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.primary,
                  backgroundColor: colors.background
                }}
                placeholder="Enter your email address"
              />
            </div>

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: `${colors.error}15`,
                  color: colors.error,
                  border: `1px solid ${colors.error}30`,
                  fontFamily: typography.fontFamily.primary
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.primary,
                color: colors.textLight,
                fontFamily: typography.fontFamily.primary
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = colors.primaryDark)}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = colors.primary)}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Sending Reset Link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Back to login link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center space-x-1 text-sm font-medium"
              style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}