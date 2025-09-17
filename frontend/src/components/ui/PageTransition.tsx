'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BRAND_CONFIG } from '../../../../shared/constants';

interface PageTransitionProps {
  children: React.ReactNode;
  duration?: number;
  type?: 'fade' | 'slide' | 'scale' | 'slideUp';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  duration = 300,
  type = 'fade'
}) => {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('fadeOut');
    }
  }, [children, displayChildren]);

  useEffect(() => {
    if (transitionStage === 'fadeOut') {
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('fadeIn');
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [transitionStage, children, duration]);

  const getAnimationClass = () => {
    const isEntering = transitionStage === 'fadeIn';

    switch (type) {
      case 'slide':
        return isEntering
          ? 'animate-slideInRight'
          : 'animate-slideOutLeft';
      case 'scale':
        return isEntering
          ? 'animate-scaleIn'
          : 'animate-scaleOut';
      case 'slideUp':
        return isEntering
          ? 'animate-slideInUp'
          : 'animate-fadeOut';
      case 'fade':
      default:
        return isEntering
          ? 'animate-fadeIn'
          : 'animate-fadeOut';
    }
  };

  return (
    <div
      className={`transition-container ${getAnimationClass()}`}
      style={{
        animationDuration: `${duration}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {displayChildren}
    </div>
  );
};

interface RouteTransitionProps {
  children: React.ReactNode;
}

export const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
  // Simplified - just return children for now to avoid transition issues
  return <>{children}</>;
};

// Smooth scroll wrapper for sections
interface SmoothScrollProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '0px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-10'
      }`}
    >
      {children}
    </div>
  );
};

// Stagger animation for lists
interface StaggerAnimationProps {
  children: React.ReactElement[];
  delay?: number;
  duration?: number;
}

export const StaggerAnimation: React.FC<StaggerAnimationProps> = ({
  children,
  delay = 100,
  duration = 500
}) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timers = children.map((_, index) =>
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [children.length, delay]);

  return (
    <>
      {children.map((child, index) => (
        <div
          key={index}
          className={`transition-all ${
            visibleItems.includes(index)
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
          style={{
            transitionDuration: `${duration}ms`,
            transitionDelay: `${index * delay}ms`
          }}
        >
          {child}
        </div>
      ))}
    </>
  );
};