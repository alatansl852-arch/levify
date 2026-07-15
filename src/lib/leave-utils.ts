import { LeaveType } from '@/contexts/LeaveContext';

export const leaveTypeLabels: Record<LeaveType, string> = {
  vacation: 'Vacation Leave',
  sick: 'Sick Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  special_privilege: 'Special Privilege Leave',
  solo_parent: 'Solo Parent Leave',
  study: 'Study Leave',
  vawc: '10-Day VAWC Leave',
  rehabilitation: 'Rehabilitation Privilege',
  special_emergency: 'Special Emergency Leave',
  adoption: 'Adoption Leave',
  calamity: 'Calamity Leave',
  monetization: 'Monetization of Leave Credits',
  terminal: 'Terminal Leave',
  forced: 'Forced Leave',
  other: 'Other',
};

export const leaveTypeDescriptions: Record<LeaveType, string> = {
  vacation: 'Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292',
  sick: 'Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292',
  maternity: 'R.A. No. 11210 / IRR issued by CSC, DOLE and SSS',
  paternity: 'R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended',
  special_privilege: 'Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292',
  solo_parent: 'R.A. No. 8972 / CSC MC No. 8, s. 2004',
  study: 'Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292',
  vawc: 'R.A. No. 9262 / CSC MC No. 15, s. 2005',
  rehabilitation: 'Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292',
  special_emergency: 'R.A. No. 9710 / CSC MC No. 25, s. 2010',
  adoption: 'R.A. No. 8552',
  calamity: 'CSC MC No. 2, s. 2012, as amended',
  monetization: 'Monetization of Vacation/Sick Leave Credits',
  terminal: 'Terminal Leave',
  forced: 'Mandatory/Forced Leave',
  other: 'Other types of leave',
};

export function getLeaveTypeLabel(type: LeaveType): string {
  return leaveTypeLabels[type] || type;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}
