'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '@/../../shared/constants';

export default function HomePage() {
  const router = useRouter();
  const { colors, typography } = BRAND_CONFIG;

  useEffect(() => {
    // Check if user has API key
    const apiKey = localStorage.getItem('api_key');
    
    if (apiKey) {
      // User is logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in, redirect to login
      router.push('/login');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid"
             style={{
               borderColor: `${colors.primary} transparent ${colors.primary} transparent`,
             }}>
        </div>
        <p className="mt-4" style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}>
          Redirecting...
        </p>
      </div>
    </div>
  );
}