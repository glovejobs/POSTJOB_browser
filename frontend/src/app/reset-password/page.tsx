'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BRAND_CONFIG } from '@/../../shared/constants';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, ShieldCheck, X } from 'lucide-react';
import { api } from '@/lib/api';

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });

  const { colors, typography } = BRAND_CONFIG;

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const checkPasswordStrength = (pwd: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Check minimum length
    if (pwd.length >= 8) {
      score++;
    } else {
      feedback.push('At least 8 characters');
    }

    // Check for uppercase
    if (/[A-Z]/.test(pwd)) {
      score++;
    } else {
      feedback.push('One uppercase letter');
    }

    // Check for lowercase
    if (/[a-z]/.test(pwd)) {
      score++;
    } else {
      feedback.push('One lowercase letter');
    }

    // Check for numbers
    if (/[0-9]/.test(pwd)) {
      score++;
    } else {
      feedback.push('One number');
    }

    // Check for special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      score++;
    } else {
      feedback.push('One special character');
    }

    return {
      score,
      feedback,
      isValid: score >= 4 && pwd.length >= 8
    };
  };

  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: [], isValid: false });
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordStrength.isValid) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', {
        token,
        password
      });
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return colors.error;
    if (passwordStrength.score <= 3) return colors.warning;
    return colors.success;
  };

  const getStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  if (success) {
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
              Password Reset Successful!
            </h1>

            <p
              className="mb-6"
              style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
            >
              Your password has been successfully reset. You will be redirected to the login page in a few seconds.
            </p>

            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium"
              style={{
                backgroundColor: colors.primary,
                color: colors.textLight,
                fontFamily: typography.fontFamily.primary
              }}
            >
              Go to Login
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
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>

            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
            >
              Set New Password
            </h1>

            <p
              className="text-sm"
              style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
            >
              Please create a strong password for your account
            </p>
          </div>

          {!token && (
            <div
              className="mb-6 p-4 rounded-lg"
              style={{
                backgroundColor: `${colors.error}15`,
                border: `1px solid ${colors.error}30`
              }}
            >
              <p
                className="text-sm"
                style={{ color: colors.error, fontFamily: typography.fontFamily.primary }}
              >
                Invalid or expired reset link. Please request a new password reset.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block mt-2 text-sm font-semibold underline"
                style={{ color: colors.error }}
              >
                Request New Reset Link
              </Link>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    fontFamily: typography.fontFamily.primary,
                    backgroundColor: colors.background
                  }}
                  placeholder="Enter your new password"
                  disabled={!token}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: colors.gray }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-medium"
                      style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
                    >
                      Password Strength:
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: getStrengthColor(), fontFamily: typography.fontFamily.primary }}
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: getStrengthColor()
                      }}
                    />
                  </div>

                  {/* Requirements checklist */}
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-1 text-xs"
                          style={{ color: colors.error, fontFamily: typography.fontFamily.primary }}
                        >
                          <X size={14} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: password && confirmPassword && password !== confirmPassword ? colors.error : colors.border,
                    color: colors.textPrimary,
                    fontFamily: typography.fontFamily.primary,
                    backgroundColor: colors.background
                  }}
                  placeholder="Confirm your new password"
                  disabled={!token}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: colors.gray }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p
                  className="mt-1 text-xs"
                  style={{ color: colors.error, fontFamily: typography.fontFamily.primary }}
                >
                  Passwords do not match
                </p>
              )}
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
              disabled={loading || !token || !passwordStrength.isValid || password !== confirmPassword}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.primary,
                color: colors.textLight,
                fontFamily: typography.fontFamily.primary
              }}
              onMouseEnter={(e) => !loading && token && (e.currentTarget.style.backgroundColor = colors.primaryDark)}
              onMouseLeave={(e) => !loading && token && (e.currentTarget.style.backgroundColor = colors.primary)}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Resetting Password...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Back to login link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium"
              style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}