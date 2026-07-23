import React, { useEffect, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface ApprovalTrailEntry {
  approver_role: string;
  action: string;
  remarks?: string;
  created_at: string;
  approver_name: string;
}

interface LeaveApplication {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  application_number: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: string;
  hr_remarks?: string;
  ovcaa_remarks?: string;
  ovcaf_remarks?: string;
}

interface Balance {
  vacationLeave: number;
  sickLeave: number;
}

interface PrintableLeaveFormProps {
  /** The leave application id to load and render */
  applicationId: number;
  /** Show the "Print" button at the top of the form. Default true. */
  showPrintButton?: boolean;
}

export default function PrintableLeaveForm({
  applicationId,
  showPrintButton = true,
}: PrintableLeaveFormProps) {
  const [application, setApplication] = useState<LeaveApplication | null>(null);
  const [trail, setTrail] = useState<ApprovalTrailEntry[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('levify_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  useEffect(() => {
    if (!applicationId) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const detailsRes = await fetch(`${API_BASE_URL}/leave/details/${applicationId}`, {
          headers: getHeaders(),
        });
        const detailsData = await detailsRes.json();

        if (detailsData.success) {
          setApplication(detailsData.application);
          setTrail(detailsData.history || []);

          const balRes = await fetch(
            `${API_BASE_URL}/leave/balance/${detailsData.application.employee_id}`,
            { headers: getHeaders() }
          );
          const balData = await balRes.json();
          if (balData.success) {
            setBalance({
              vacationLeave: balData.balance.vacationLeave,
              sickLeave: balData.balance.sickLeave,
            });
          }
        } else {
          setError(detailsData.message || 'Application not found.');
        }
      } catch (err) {
        console.error('Failed to load printable form data:', err);
        setError('Failed to load the printable form. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [applicationId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const findApprover = (role: string) => trail.find((t) => t.approver_role === role);

  // Note: current balance already reflects this application's deduction (it was
  // approved before this loads). "Total Earned" is reconstructed as current
  // balance + this application's days, ONLY for whichever leave type (VL or SL)
  // this application actually drew from. This is an approximation for display
  // purposes, not a new source of truth — the database balance fields remain
  // authoritative.
  const isVacation = application?.leave_type?.toLowerCase().includes('vacation');
  const isSick = application?.leave_type?.toLowerCase().includes('sick');
  const days = application?.days_count || 0;

  const vlEarned = (balance?.vacationLeave || 0) + (isVacation ? days : 0);
  const vlLess = isVacation ? days : 0;
  const vlBalance = balance?.vacationLeave || 0;

  const slEarned = (balance?.sickLeave || 0) + (isSick ? days : 0);
  const slLess = isSick ? days : 0;
  const slBalance = balance?.sickLeave || 0;

  const hrEntry = findApprover('hr');
  const ovcaaEntry = findApprover('ovcaa');
  const ovcafEntry = findApprover('ovcaf');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{error || 'Application not found.'}</p>
      </div>
    );
  }

  return (
    <div id="printable-leave-form-root">
      {showPrintButton && (
        <div className="flex justify-end mb-4 print:hidden">
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      )}

      {/* Printable form */}
      <div className="bg-white text-black p-6 shadow-sm print:shadow-none print:p-0 text-sm rounded-lg border print:border-none">
        <div className="text-center mb-6 space-y-1">
          <p className="font-bold uppercase">Civil Service Commission</p>
          <p className="font-semibold">Application for Leave</p>
          <p className="text-xs">Application No. {application.application_number}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 border-y py-2">
          <p><span className="text-muted-foreground">Employee:</span> {application.employee_name}</p>
          <p><span className="text-muted-foreground">Department:</span> {application.department}</p>
          <p><span className="text-muted-foreground">Position:</span> {application.position}</p>
          <p><span className="text-muted-foreground">Leave Type:</span> {application.leave_type}</p>
          <p><span className="text-muted-foreground">Inclusive Dates:</span> {formatDate(application.start_date)} - {formatDate(application.end_date)}</p>
          <p><span className="text-muted-foreground">Days:</span> {application.days_count}</p>
        </div>

        <p className="font-bold mb-2">7. DETAILS OF ACTION ON APPLICATION</p>

        {/* 7.A Certification of Leave Credits */}
        <div className="border p-3 mb-3">
          <p className="font-semibold mb-2">7.A CERTIFICATION OF LEAVE CREDITS</p>
          <p className="text-xs mb-2">As of {formatDate(new Date().toISOString())}</p>
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                <td className="border p-1"></td>
                <td className="border p-1 font-medium">Vacation Leave</td>
                <td className="border p-1 font-medium">Sick Leave</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-1 text-left">Total Earned</td>
                <td className="border p-1">{vlEarned.toFixed(2)}</td>
                <td className="border p-1">{slEarned.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border p-1 text-left">Less this application</td>
                <td className="border p-1">{vlLess > 0 ? vlLess.toFixed(2) : '-'}</td>
                <td className="border p-1">{slLess > 0 ? slLess.toFixed(2) : '-'}</td>
              </tr>
              <tr>
                <td className="border p-1 text-left font-medium">Balance</td>
                <td className="border p-1 font-medium">{vlBalance.toFixed(2)}</td>
                <td className="border p-1 font-medium">{slBalance.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-between items-end mt-6">
            <div className="border-t border-black w-56 pt-1 text-center">
              {hrEntry?.approver_name || '\u00A0'}
              <p className="text-xs">Authorized Officer (HR)</p>
            </div>
          </div>
        </div>

        {/* 7.B Recommendation */}
        <div className="border p-3 mb-3">
          <p className="font-semibold mb-2">7.B RECOMMENDATION</p>
          <p>
            <span className="inline-block w-4 h-4 border border-black mr-2 align-middle">
              {ovcaaEntry?.action === 'approved' ? '✓' : ''}
            </span>
            For approval
          </p>
          <p className="mt-1">
            <span className="inline-block w-4 h-4 border border-black mr-2 align-middle">
              {ovcaaEntry?.action === 'rejected' ? '✓' : ''}
            </span>
            For disapproval due to {ovcaaEntry?.action === 'rejected' ? ovcaaEntry.remarks : '_______________________'}
          </p>
          <div className="flex justify-between items-end mt-6">
            <div className="border-t border-black w-56 pt-1 text-center">
              {ovcaaEntry?.approver_name || '\u00A0'}
              <p className="text-xs">Authorized Officer (OVCAA)</p>
            </div>
          </div>
        </div>

        {/* 7.C / 7.D Approved / Disapproved */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border p-3">
            <p className="font-semibold mb-2">7.C APPROVED FOR:</p>
            <p>____ days with pay</p>
            <p className="mt-1">____ days without pay</p>
            <p className="mt-1">____ others (Specify) ______________</p>
            <div className="mt-8 border-t border-black pt-1 text-center">
              {application.status === 'approved' ? ovcafEntry?.approver_name || '\u00A0' : '\u00A0'}
              <p className="text-xs">Authorized Officer (OVCAF)</p>
            </div>
          </div>
          <div className="border p-3">
            <p className="font-semibold mb-2">7.D DISAPPROVED DUE TO:</p>
            <p>{application.status.includes('rejected') ? (application.ovcaf_remarks || application.ovcaa_remarks || application.hr_remarks) : '\u00A0'}</p>
            <div className="mt-8 border-t border-black pt-1 text-center">
              {application.status.includes('rejected') ? ovcafEntry?.approver_name || '\u00A0' : '\u00A0'}
              <p className="text-xs">Authorized Officer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}