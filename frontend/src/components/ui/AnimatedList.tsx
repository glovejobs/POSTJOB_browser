'use client';

import React, { useEffect, useState } from 'react';
import { BRAND_CONFIG } from '../../../../shared/constants';

interface AnimatedListProps {
  children: React.ReactNode[];
  className?: string;
  stagger?: number;
  initialDelay?: number;
}

export function AnimatedList({
  children,
  className = '',
  stagger = 50,
  initialDelay = 0
}: AnimatedListProps) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    children.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, initialDelay + index * stagger);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [children.length, stagger, initialDelay]);

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={`
            transition-all duration-500 ease-out
            ${visibleItems.includes(index)
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
            }
          `}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  delay?: number;
}

export function AnimatedListItem({
  children,
  onClick,
  className = '',
  delay = 0
}: AnimatedListItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { colors, shadows } = BRAND_CONFIG;

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div
      className={`
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        transform: isHovered ? 'translateX(4px)' : undefined,
        boxShadow: isHovered ? shadows.md : undefined,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}