import React from 'react';
import { cn } from '@/lib/utils';

// ✅ Define and export LeaveStatus here with ALL backend statuses
export type LeaveStatus =
  | 'pending'
  | 'hr_approved'
  | 'hr_rejected'
  | 'ovcaa_approved'
  | 'ovcaa_endorsed'
  | 'ovcaa_rejected'
  | 'ovcaf_approved'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'cancelled';

interface StatusBadgeProps {
  status: LeaveStatus;
  className?: string;
}

const statusConfig: Record<LeaveStatus, { label: string; className: string }> = {
  pending:        { label: 'Pending',         className: 'status-pending' },
  hr_approved:    { label: 'HR Approved',     className: 'status-endorsed' },
  hr_rejected:    { label: 'HR Rejected',     className: 'status-rejected' },
  ovcaa_approved: { label: 'OVCAA Approved',  className: 'status-endorsed' },
  ovcaa_endorsed: { label: 'OVCAA Endorsed',  className: 'status-endorsed' },
  ovcaa_rejected: { label: 'OVCAA Rejected',  className: 'status-rejected' },
  ovcaf_approved: { label: 'OVCAF Approved',  className: 'status-approved' },
  approved:       { label: 'Approved',        className: 'status-approved' },
  rejected:       { label: 'Rejected',        className: 'status-rejected' },
  returned:       { label: 'Returned',        className: 'status-pending' },
  cancelled:      { label: 'Cancelled',       className: 'status-pending' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    console.warn(`Unknown status: "${status}"`);
    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800', className)}>
        {status || 'Unknown'}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}