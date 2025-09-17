'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/api';
import { BRAND_CONFIG } from '@/../../shared/constants';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors, typography } = BRAND_CONFIG;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Form submitted - preventing default');
    console.log('Email:', email);
    console.log('IsSignUp:', isSignUp);

    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Register new user
        console.log('Attempting registration for:', email);
        const registerResult = await auth.register(email);
        console.log('Registration result:', registerResult);

        if (registerResult && registerResult.apiKey) {
          localStorage.setItem('api_key', registerResult.apiKey);
          localStorage.setItem('user_email', email);
          localStorage.setItem('user_name', fullName);
          console.log('Registration successful, navigating to dashboard...');

          // Force navigation with a fallback
          await router.push('/dashboard');

          // Fallback: if router.push doesn't work, use window.location
          setTimeout(() => {
            if (window.location.pathname !== '/dashboard') {
              console.log('Router push failed, using window.location');
              window.location.href = '/dashboard';
            }
          }, 1000);
        } else {
          throw new Error('Invalid registration response');
        }
      } else {
        // Login existing user
        console.log('Attempting login for:', email);
        const loginResult = await auth.login(email);
        console.log('Login result:', loginResult);

        if (loginResult && loginResult.apiKey) {
          localStorage.setItem('api_key', loginResult.apiKey);
          localStorage.setItem('user_email', email);
          console.log('Login successful, navigating to dashboard...');

          // Force navigation with a fallback
          await router.push('/dashboard');

          // Fallback: if router.push doesn't work, use window.location
          setTimeout(() => {
            if (window.location.pathname !== '/dashboard') {
              console.log('Router push failed, using window.location');
              window.location.href = '/dashboard';
            }
          }, 1000);
        } else {
          throw new Error('Invalid login response');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.response?.status === 404 && !isSignUp) {
        setError('No account found with this email. Please sign up first.');
      } else if (err?.response?.status === 400 && err?.response?.data?.error === 'User already exists' && isSignUp) {
        // User already exists, suggest they log in instead
        setError('An account with this email already exists. Please log in instead.');
        // Optionally, automatically switch to login mode
        setTimeout(() => {
          setIsSignUp(false);
          setError(null);
        }, 3000);
      } else if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to authenticate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Google OAuth implementation would go here
    console.log('Google sign-in not yet implemented');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.background }}>
      {/* Left Panel - Hero Image */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="max-w-lg text-center">
          <h2
            className="text-3xl font-semibold mb-4"
            style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
          >
            Land where you belong.
          </h2>
          <p
            className="text-lg"
            style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
          >
            Search opportunities at established giants and tomorrow's breakout companies.
          </p>
          <div className="mt-12">
            <Image
              src="/assets/job-illustration.svg"
              alt="Job posting illustration"
              width={400}
              height={400}
              className="mx-auto"
              priority
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span
                className="text-2xl font-semibold"
                style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
              >
                PostJob
              </span>
            </div>

            <h1
              className="text-3xl font-bold"
              style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}
            >
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p
              className="mt-2 text-base"
              style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}
            >
              {isSignUp ? 'Find your next opportunity!' : 'Sign in to continue posting jobs'}
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 border rounded-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5"
            style={{ borderColor: colors.border }}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span style={{ color: colors.textPrimary }}>
              {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: colors.border }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4" style={{ backgroundColor: colors.background, color: colors.gray }}>
                Or {isSignUp ? 'Sign Up' : 'Sign In'} with Email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.dark }}
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.dark }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  borderColor: colors.border,
                  color: colors.textPrimary
                }}
                placeholder="example@postjob.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.dark }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
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
              {!isSignUp && (
                <div className="mt-2 text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium hover:underline"
                    style={{ color: colors.primary, fontFamily: typography.fontFamily.primary }}
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}
            </div>

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: `${colors.error}15`,
                  color: colors.error,
                  border: `1px solid ${colors.error}30`
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </form>

          {/* Terms and Privacy */}
          {isSignUp && (
            <p className="text-xs text-center" style={{ color: colors.gray }}>
              By continuing, you accept our standard{' '}
              <Link href="/terms" className="underline">
                terms and conditions
              </Link>{' '}
              and our{' '}
              <Link href="/privacy" className="underline">
                privacy policy
              </Link>
              .
            </p>
          )}

          {/* Toggle Sign In/Sign Up */}
          <p className="text-center" style={{ color: colors.gray }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-medium underline"
              style={{ color: colors.dark }}
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}