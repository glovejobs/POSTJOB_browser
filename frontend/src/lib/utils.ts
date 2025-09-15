import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatSalary(min?: number, max?: number): string {
  if (min && max) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  } else if (min) {
    return `${formatCurrency(min)}+`;
  } else if (max) {
    return `Up to ${formatCurrency(max)}`;
  }
  return 'Not specified';
}