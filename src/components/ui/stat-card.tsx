import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
}

// All variants use maroon (primary)
const variantStyles = {
  default:   'before:bg-primary',
  primary:   'before:bg-primary',
  secondary: 'before:bg-primary',
  success:   'before:bg-primary',
  warning:   'before:bg-primary',
};

const iconVariantStyles = {
  default:   'bg-primary/10 text-primary',
  primary:   'bg-primary/10 text-primary',
  secondary: 'bg-primary/10 text-primary',
  success:   'bg-primary/10 text-primary',
  warning:   'bg-primary/10 text-primary',
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <div className={cn('stat-card card-hover', variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-primary">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p className={cn('mt-2 text-sm font-medium', trend.isPositive ? 'text-primary' : 'text-destructive')}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              <span className="text-muted-foreground font-normal"> from last month</span>
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', iconVariantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}