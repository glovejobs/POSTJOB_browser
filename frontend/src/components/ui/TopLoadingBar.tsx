'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { BRAND_CONFIG } from '../../../../shared/constants';

export function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { colors } = BRAND_CONFIG;

  useEffect(() => {
    // Start loading
    setLoading(true);
    setProgress(30);

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(60), 100);
    const timer2 = setTimeout(() => setProgress(90), 200);

    // Complete loading
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 transition-all duration-300 ease-out"
      style={{
        background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryDark || colors.primary} 100%)`,
        width: `${progress}%`,
        boxShadow: `0 0 10px ${colors.primary}40`,
        opacity: loading ? 1 : 0
      }}
    />
  );
}