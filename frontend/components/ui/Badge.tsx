'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'featured' | 'urgent' | 'success' | 'warning';
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    featured: 'bg-bihar-yellow text-gray-900',
    urgent: 'bg-red-500 text-white',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}