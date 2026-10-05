import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave, LeaveType } from '@/contexts/LeaveContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  leaveTypeLabels,
  leaveTypeDescriptions,
  calculateWorkingDays,
  isWorkingDay,
  parseLocalDate,
} from '@/lib/leave-utils';
import { getDailyRate, computeCashValue } from '@/lib/salary-utils';
import { FileText, Calendar as CalendarIcon, AlertCircle, X } from 'lucide-react';

const leaveCategories = {
  regular: ['vacation', 'sick', 'special_privilege', 'forced'] as LeaveType[],
  special: ['maternity', 'paternity', 'solo_parent', 'study', 'vawc', 'rehabilitation', 'special_emergency', 'adoption', 'calamity'] as LeaveType[],
  other: ['terminal', 'other'] as LeaveType[],
};

// ---------------------------------------------------------------------------
// Short "at a glance" duration/notice label shown beside each leave type in
// the Select dropdown, so users don't have to open a type first to learn its
// limit. Mirrors leaveDateRules below (minAdvanceDays/maxDurationDays), but
// kept as its own map since a couple of types (e.g. sick leave, which is
// allowRetroactive but also filed in advance) read better with custom text
// than a mechanically-derived one.
// ---------------------------------------------------------------------------
const leaveTypeDurationLabels: Partial<Record<LeaveType, string>> = {
  vacation: '5 days notice',
  sick: 'upon return',
  special_privilege: '3 days',
  forced: '5 days',
  maternity: '105 days',
  paternity: '7 days',
  solo_parent: '7 days',
  study: '6 months',
  vawc: '10 days',
  rehabilitation: '6 months',
  special_emergency: '5 days',
  calamity: '5 days',
  adoption: '—',
  terminal: '—',
  other: '—',
};

// ---------------------------------------------------------------------------
// CSC Omnibus Rules on Leave — per-leave-type date constraints.
// Source: "Instructions and Requirements" (agency leave form, sections 1-15).
// Each rule drives which dates are selectable in the Inclusive Dates pickers
// and the submit-time validation below. Types not listed fall back to
// `defaultRule`.
// ---------------------------------------------------------------------------
interface LeaveDateRule {
  /** Must be filed at least this many days before the start date. */
  minAdvanceDays?: number;
  /** Max days allowed. Counted in calendar days (end - start + 1) unless maxInWorkingDays is true. */
  maxDurationDays?: number;
  /** If true, maxDurationDays counts working days only (Sundays, and Saturdays for staff, are not counted). */
  maxInWorkingDays?: boolean;
  /** If true, start/end dates may fall in the past (filed upon/after return). */
  allowRetroactive?: boolean;
  /** Short helper text shown under Inclusive Dates for this leave type. */
  note: string;
}

const defaultRule: LeaveDateRule = {
  allowRetroactive: false,
  note: '',
};

const leaveDateRules: Partial<Record<LeaveType, LeaveDateRule>> = {
  vacation: {
    minAdvanceDays: 5,
    allowRetroactive: false,
    note: 'File at least 5 days before your start date, whenever possible.',
  },
  sick: {
    allowRetroactive: true,
    note: 'File immediately upon your return, or in advance. A medical certificate is required if filed 5+ days in advance, or if the leave exceeds 5 days.',
  },
  special_privilege: {
    minAdvanceDays: 7,
    maxDurationDays: 3,
    maxInWorkingDays: true,
    allowRetroactive: false,
    note: 'File at least 1 week before availment. Maximum of 3 working days.',
  },
  forced: {
    maxDurationDays: 5,
    maxInWorkingDays: true,
    allowRetroactive: false,
    note: 'Mandatory 5-day annual vacation leave, scheduled within the year.',
  },
  maternity: {
    maxDurationDays: 105,
    allowRetroactive: false,
    note: 'Up to 105 days. File in advance with proof of pregnancy (ultrasound/doctor\u2019s certificate).',
  },
  paternity: {
    maxDurationDays: 7,
    maxInWorkingDays: true,
    allowRetroactive: false,
    note: 'Up to 7 working days. Requires proof of child\u2019s delivery (birth certificate, medical certificate, marriage contract).',
  },
  solo_parent: {
    minAdvanceDays: 5,
    maxDurationDays: 7,
    maxInWorkingDays: true,
    allowRetroactive: false,
    note: 'File at least 5 days in advance, with updated Solo Parent ID. Up to 7 working days.',
  },
  study: {
    maxDurationDays: 180,
    allowRetroactive: false,
    note: 'Up to 6 months, subject to agency requirements and an agency-employee contract.',
  },
  vawc: {
    maxDurationDays: 10,
    maxInWorkingDays: true,
    allowRetroactive: true,
    note: 'Up to 10 working days. May be filed in advance or immediately upon your return.',
  },
  rehabilitation: {
    maxDurationDays: 180,
    allowRetroactive: false,
    note: 'Up to 6 months. File within 1 week of the accident, unless a longer period is warranted.',
  },
  special_emergency: {
    maxDurationDays: 5,
    maxInWorkingDays: true,
    allowRetroactive: false,
    note: 'Up to 5 working days (straight or staggered) within 30 days of the calamity.',
  },
  calamity: {
    maxDurationDays: 5,
    maxInWorkingDays: true,
    allowRetroactive: false,
    note: 'Up to 5 working days (straight or staggered) within 30 days of the calamity.',
  },
  adoption: {
    allowRetroactive: false,
    note: 'Requires an authenticated Pre-Adoptive Placement Authority (DSWD).',
  },
  terminal: {
    allowRetroactive: false,
    note: 'Requires proof of resignation, retirement, or separation from service.',
  },
  other: {
    allowRetroactive: true,
    note: '',
  },
};

/**
 * Formats a Date object as a local-time yyyy-mm-dd string.
 * NOTE: Deliberately avoids `.toISOString()`, which converts to UTC first —
 * in timezones ahead of UTC (e.g. UTC+8) that silently rolls local midnight
 * back to the previous calendar day.
 */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Adds `days` to a yyyy-mm-dd string and returns a yyyy-mm-dd string, entirely in local time. */
function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** Returns the date (yyyy-mm-dd) of the Nth working day, counting `startStr` as day 1. */
function nthWorkingDayFrom(startStr: string, n: number, isFaculty: boolean): string {
  const d = parseLocalDate(startStr);
  let count = isWorkingDay(d, isFaculty) ? 1 : 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (isWorkingDay(d, isFaculty)) count++;
  }
  return toDateString(d);
}

/** Formats a number as pesos with two decimals, e.g. 719.23 -> "₱719.23". */
function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Date picker (shadcn Calendar in a Popover). Unselectable dates (past dates,
// Sundays, non-working Saturdays, out-of-range dates) are greyed out and
// can't be clicked, which the native <input type="date"> can't do.
// ---------------------------------------------------------------------------
interface DatePickerFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  isDateDisabled: (date: Date) => boolean;
  defaultMonth?: Date;
}

function DatePickerField({ id, value, onChange, isDateDisabled, defaultMonth }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseLocalDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'MMM d, yyyy') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? defaultMonth}
          onSelect={(date) => {
            if (date) {
              onChange(toDateString(date));
              setOpen(false);
            }
          }}
          disabled={isDateDisabled}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

export default function ApplyLeavePage() {
  const { user } = useAuth();
  const { addLeaveRequest, getEmployeeLeaveBalance } = useLeave();
  const navigate = useNavigate();

  // Faculty have Friday/Saturday classes, so Saturday counts as a working day for them.
  const isFaculty = user?.role === 'faculty';

  // Leave type starts unselected so Inclusive Dates (and other type-specific
  // sections) only appear once the user has actually made a choice.
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState<'within_ph' | 'abroad'>('within_ph');
  const [hospitalDetails, setHospitalDetails] = useState('');
  const [commutation, setCommutation] = useState<'requested' | 'not_requested'>('not_requested');
  const [monetizationRequested, setMonetizationRequested] = useState(false);
  const [monetizationDays, setMonetizationDays] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [otherLeaveType, setOtherLeaveType] = useState('');

  // FIXED: Use employeeId instead of id — balances are keyed by employeeId
  const balance = user ? getEmployeeLeaveBalance(user.employeeId) : undefined;
  const numberOfDays = startDate && endDate ? calculateWorkingDays(startDate, endDate, isFaculty) : 0;
  const isWeekendOnlyRange = !!startDate && !!endDate && numberOfDays === 0;

  // Inclusive calendar-day span (end - start + 1), used against maxDurationDays
  // since CSC limits like "105 days" / "7 days" count calendar days, not
  // working days (numberOfDays above is for balance deduction only).
  const calendarDays = startDate && endDate
    ? Math.round((new Date(`${endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) / 86400000) + 1
    : 0;

  const dateRule = leaveType ? (leaveDateRules[leaveType] ?? defaultRule) : defaultRule;

  // Days counted against this leave type's max duration (working days or calendar days).
  const countedDays = dateRule.maxInWorkingDays ? numberOfDays : calendarDays;

  // FIXED: built from local calendar fields (no UTC round-trip), so it can't
  // drift a day depending on timezone/time-of-day.
  const todayStr = toDateString(new Date());

  // Earliest selectable start date for this leave type.
  // Today is allowed; yesterday and earlier are blocked (unless the leave type
  // is filed upon/after return, e.g. Sick Leave).
  const minStartDate = dateRule.allowRetroactive
    ? undefined
    : dateRule.minAdvanceDays
      ? addDaysToDateString(todayStr, dateRule.minAdvanceDays)
      : todayStr;

  // End date can't be before start date; if a max duration applies, cap it too.
  const minEndDate = startDate || minStartDate;
  const getMaxEndDate = (start: string): string | undefined => {
    if (!dateRule.maxDurationDays || !start) return undefined;
    return dateRule.maxInWorkingDays
      ? nthWorkingDayFrom(start, dateRule.maxDurationDays, isFaculty)
      : addDaysToDateString(start, dateRule.maxDurationDays - 1);
  };
  const maxEndDate = getMaxEndDate(startDate);

  // Which calendar days are greyed out / unclickable.
  const isStartDateDisabled = (date: Date): boolean => {
    if (!isWorkingDay(date, isFaculty)) return true;
    const s = toDateString(date);
    if (minStartDate && s < minStartDate) return true;
    return false;
  };

  const isEndDateDisabled = (date: Date): boolean => {
    if (!isWorkingDay(date, isFaculty)) return true;
    const s = toDateString(date);
    if (minEndDate && s < minEndDate) return true;
    if (maxEndDate && s > maxEndDate) return true;
    return false;
  };

  // When the start date changes, drop the end date if it no longer fits.
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (endDate) {
      const newMaxEnd = getMaxEndDate(value);
      if (endDate < value || (newMaxEnd && endDate > newMaxEnd)) {
        setEndDate('');
      }
    }
  };

  // Clear the picked dates whenever the leave type changes so a stale
  // selection from a previous type (e.g. a 90-day range picked under
  // "Study") can't linger as invalid under the newly selected type.
  useEffect(() => {
    setStartDate('');
    setEndDate('');
  }, [leaveType]);

  // ---------------------------------------------------------------------------
  // Monetization estimate — CSC formula: monthly salary ÷ 22 = daily rate.
  // Uses the same salary-grade table as the HR review modal (src/lib/salary-utils),
  // so the employee's estimate matches what HR sees.
  // ---------------------------------------------------------------------------
  const dailyRate = getDailyRate(user?.salary_grade);
  const hasSalaryData = dailyRate > 0;

  const parsedMonetizationDays = parseFloat(monetizationDays);
  const calculateMonetizationAmount = () => {
    if (!monetizationRequested || !monetizationDays || isNaN(parsedMonetizationDays)) return 0;
    return computeCashValue(user?.salary_grade, parsedMonetizationDays);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (uploadedFiles.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Max size is 5MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) uploaded successfully`);
    }

    // Reset input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('File removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!leaveType) {
      toast.error('Please select a leave type');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }

    // Start and end dates must fall on a working day (no Sundays; no Saturdays for non-faculty)
    if (!isWorkingDay(parseLocalDate(startDate), isFaculty) || !isWorkingDay(parseLocalDate(endDate), isFaculty)) {
      toast.error('Invalid date selected', {
        description: isFaculty
          ? 'Sundays are non-working days. Please choose a different date.'
          : 'Saturdays and Sundays are non-working days. Please choose a different date.',
      });
      return;
    }

    if (numberOfDays === 0) {
      toast.error('Selected dates contain no working days', {
        description: 'Please choose a date range that includes at least one working day.',
      });
      return;
    }

    // CSC advance-notice check (skip for leave types filed upon/after return)
    if (!dateRule.allowRetroactive && minStartDate && startDate < minStartDate) {
      toast.error('Advance notice required', {
        description: dateRule.minAdvanceDays
          ? `${leaveTypeLabels[leaveType]} must be filed at least ${dateRule.minAdvanceDays} day(s) before the start date.`
          : `${leaveTypeLabels[leaveType]} cannot be backdated.`,
      });
      return;
    }

    // CSC max-duration check
    if (dateRule.maxDurationDays && countedDays > dateRule.maxDurationDays) {
      toast.error('Duration exceeds the allowed limit', {
        description: `${leaveTypeLabels[leaveType]} is limited to ${dateRule.maxDurationDays} ${dateRule.maxInWorkingDays ? 'working ' : ''}day(s). You selected ${countedDays}.`,
      });
      return;
    }

    if (monetizationRequested && !monetizationDays) {
      toast.error('Please enter number of days to monetize');
      return;
    }

    // NEW: validate the monetization day count itself
    if (monetizationRequested) {
      if (isNaN(parsedMonetizationDays) || parsedMonetizationDays <= 0) {
        toast.error('Days to monetize must be greater than 0');
        return;
      }
      const maxMonetizable = balance?.vacationLeave ?? 0;
      if (parsedMonetizationDays > maxMonetizable) {
        toast.error('Not enough vacation leave credits', {
          description: `You can monetize at most ${maxMonetizable.toFixed(2)} vacation leave day(s).`,
        });
        return;
      }
    }

    if (leaveType === 'other' && !otherLeaveType.trim()) {
      toast.error('Please specify the leave type');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get API base URL from environment variable
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

      // Get auth token
      const token = localStorage.getItem('levify_token');

      // Create FormData to send files
      const formData = new FormData();

      // Add all form fields
      formData.append('employee_id', user.employeeId);
      formData.append('leave_type', leaveType === 'other' ? otherLeaveType : leaveTypeLabels[leaveType]);
      formData.append('leave_location', location);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      formData.append('days_count', numberOfDays.toString());
      formData.append('reason', reason);
      formData.append('monetize_credits', monetizationRequested ? '1' : '0');
      // FIXED: the number of days to monetize was never sent before, so the
      // backend/HR modal fell back to days_count (the leave duration).
      formData.append('monetization_days', monetizationRequested ? String(parsedMonetizationDays) : '0');
      formData.append('commutation_requested', commutation === 'requested' ? '1' : '0');

      // Add hospital details if sick leave
      if (leaveType === 'sick' && hospitalDetails) {
        formData.append('hospital_details', hospitalDetails);
      }

      // Add files to FormData
      uploadedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      // Make API call to backend
      const response = await fetch(`${API_BASE_URL}/leave/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Leave application submitted successfully!', {
          description: `Application ${data.application_number} has been forwarded to HR for processing.`,
        });
        navigate('/leave-history');
      } else {
        toast.error('Failed to submit application', {
          description: data.message,
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit leave application', {
        description: 'Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Apply for Leave"
        description="Submit your leave application following CSC guidelines"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Leave Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Type of Leave
                </CardTitle>
                <CardDescription>
                  Select the type of leave as prescribed by CSC Omnibus Rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Regular Leave Types</Label>
                  <Select
                    value={leaveType}
                    onValueChange={(v) => setLeaveType(v as LeaveType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a leave type" />
                    </SelectTrigger>
                    {/* Widened so the day/month badge has room next to longer
                        leave-type labels without wrapping. */}
                    <SelectContent className="min-w-[22rem]">
                      <SelectGroup>
                        <SelectLabel>Regular Leave</SelectLabel>
                        {leaveCategories.regular.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center justify-between gap-4 w-full">
                              <span>{leaveTypeLabels[type]}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {leaveTypeDurationLabels[type]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="mt-1">Special Leave</SelectLabel>
                        {leaveCategories.special.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center justify-between gap-4 w-full">
                              <span>{leaveTypeLabels[type]}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {leaveTypeDurationLabels[type]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="mt-1">Other</SelectLabel>
                        {leaveCategories.other.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center justify-between gap-4 w-full">
                              <span>{leaveTypeLabels[type]}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {leaveTypeDurationLabels[type]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {leaveType && (
                    <p className="text-xs text-muted-foreground">
                      {leaveTypeDescriptions[leaveType]}
                    </p>
                  )}
                </div>

                {/* Other Leave Type Specification */}
                {leaveType === 'other' && (
                  <div className="space-y-3 rounded-lg border p-4 bg-blue-50 dark:bg-blue-950">
                    <Label htmlFor="other_leave_type">Please Specify Leave Type *</Label>
                    <Input
                      id="other_leave_type"
                      placeholder="Enter the specific type of leave"
                      value={otherLeaveType}
                      onChange={(e) => setOtherLeaveType(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Please provide details about the type of leave you are applying for.
                    </p>
                  </div>
                )}

                {/* Vacation/Sick Leave Details */}
                {leaveType === 'vacation' && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Label>Details of Leave (Vacation/Special Privilege Leave)</Label>
                    <RadioGroup value={location} onValueChange={(v) => setLocation(v as 'within_ph' | 'abroad')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="within_ph" id="within_ph" />
                        <Label htmlFor="within_ph" className="font-normal">Within the Philippines</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="abroad" id="abroad" />
                        <Label htmlFor="abroad" className="font-normal">Abroad (Specify)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {leaveType === 'sick' && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Label>Details of Leave (Sick Leave)</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="in_hospital" />
                        <Label htmlFor="in_hospital" className="font-normal">In Hospital (Specify Illness)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="out_patient" />
                        <Label htmlFor="out_patient" className="font-normal">Out Patient (Specify Illness)</Label>
                      </div>
                    </div>
                    <Input
                      placeholder="Specify hospital/clinic and illness"
                      value={hospitalDetails}
                      onChange={(e) => setHospitalDetails(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date Selection — only shown once a leave type has been picked,
                since the rules (min advance days, max duration) depend on it. */}
            {leaveType && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Inclusive Dates
                  </CardTitle>
                  <CardDescription>
                    Select the start and end dates of your leave
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <DatePickerField
                        id="start_date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        isDateDisabled={isStartDateDisabled}
                        defaultMonth={minStartDate ? parseLocalDate(minStartDate) : undefined}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <DatePickerField
                        id="end_date"
                        value={endDate}
                        onChange={setEndDate}
                        isDateDisabled={isEndDateDisabled}
                        defaultMonth={
                          startDate
                            ? parseLocalDate(startDate)
                            : minStartDate
                              ? parseLocalDate(minStartDate)
                              : undefined
                        }
                      />
                    </div>
                  </div>

                  {dateRule.note && (
                    <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {dateRule.note}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-muted-foreground">
                    {isFaculty
                      ? 'Sundays are non-working days and cannot be selected.'
                      : 'Saturdays and Sundays are non-working days and cannot be selected.'}
                  </p>

                  {startDate && endDate && (
                    <p className="mt-3 text-sm font-medium">
                      Number of Working Days: <span className="text-primary">{numberOfDays}</span>
                      {isWeekendOnlyRange && (
                        <span className="ml-2 text-xs font-normal text-destructive">
                          (selected dates fall on non-working days — no working days in this range)
                        </span>
                      )}
                      {dateRule.maxDurationDays && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({countedDays}/{dateRule.maxDurationDays} {dateRule.maxInWorkingDays ? 'working' : 'calendar'} days used)
                        </span>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reason */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reason for Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Provide a detailed reason for your leave application..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </CardContent>
            </Card>

            {/* Monetization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Monetization of Leave Credits
                </CardTitle>
                <CardDescription>
                  Convert your unused vacation leave credits to cash (Optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="monetization_checkbox"
                    checked={monetizationRequested}
                    onCheckedChange={(checked) => {
                      setMonetizationRequested(checked as boolean);
                      if (!checked) setMonetizationDays('');
                    }}
                  />
                  <Label htmlFor="monetization_checkbox" className="font-normal">
                    I want to monetize my leave credits
                  </Label>
                </div>

                {monetizationRequested && (
                  <div className="space-y-3 rounded-lg border p-4 bg-secondary/10 mt-3">
                    <p className="text-sm text-muted-foreground">
                      Monetization of leave credits is subject to availability of funds and approval by the agency head.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="monetization_days">Number of Days to Monetize</Label>
                      <Input
                        id="monetization_days"
                        type="number"
                        min="1"
                        max={balance?.vacationLeave || 15}
                        placeholder="Enter number of days"
                        value={monetizationDays}
                        onChange={(e) => setMonetizationDays(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum monetizable: {balance?.vacationLeave?.toFixed(2) || 0} vacation leave days
                      </p>
                      {monetizationDays && (
                        <div className="mt-3 p-4 bg-primary/10 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Daily Rate{hasSalaryData ? ' (salary ÷ 22)' : ''}:</span>
                            <span className="text-sm font-medium">{formatPeso(dailyRate)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Days:</span>
                            <span className="text-sm font-medium">{monetizationDays}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between items-center">
                            <span className="text-sm font-semibold">Estimated Amount:</span>
                            <span className="text-lg font-bold text-primary">
                              {formatPeso(calculateMonetizationAmount())}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Calculation: {monetizationDays} days × {formatPeso(dailyRate)} = {formatPeso(calculateMonetizationAmount())}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            *Subject to final computation and fund availability
                          </p>
                          {!hasSalaryData && (
                            <p className="text-xs text-destructive">
                              Your salary grade was not found, so no estimate can be shown. HR will compute the final amount.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachment</CardTitle>
                <CardDescription>
                  Upload supporting documents (Optional) - Max 5 files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadedFiles.length < 5 && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      id="file-upload"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Click to upload files</p>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, PNG, DOC (Max 5MB each) - {uploadedFiles.length}/5 files
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="text-sm flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Application Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Leave Type:</span>
                    <span className="font-medium">
                      {leaveType
                        ? (leaveType === 'other' && otherLeaveType
                            ? otherLeaveType
                            : leaveTypeLabels[leaveType])
                        : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">
                      {numberOfDays} day(s)
                      {isWeekendOnlyRange && (
                        <span className="ml-1 text-xs text-destructive">(non-working days only)</span>
                      )}
                    </span>
                  </div>
                  {startDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">From:</span>
                      <span className="font-medium">{startDate}</span>
                    </div>
                  )}
                  {endDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">To:</span>
                      <span className="font-medium">{endDate}</span>
                    </div>
                  )}

                  {monetizationRequested && monetizationDays && (
                    <>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-muted-foreground">Monetization:</span>
                        <span className="font-medium">{monetizationDays} day(s)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Amount:</span>
                        <span className="font-medium text-primary">
                          {formatPeso(calculateMonetizationAmount())}
                        </span>
                      </div>
                    </>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attachments:</span>
                      <span className="font-medium">{uploadedFiles.length} file(s)</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Your Leave Balance:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vacation Leave:</span>
                      <span>{balance?.vacationLeave?.toFixed(2) || '0.00'} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sick Leave:</span>
                      <span>{balance?.sickLeave?.toFixed(2) || '0.00'} days</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    Your application will be reviewed by HR, then forwarded to OVCAA/OVCAF for approval.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}