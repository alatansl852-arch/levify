import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ---------------------------------------------------------------------------
// Edit these to change the printed letterhead and the signature block.
// ---------------------------------------------------------------------------
const LETTERHEAD_LINES = ['Republic of the Philippines', 'MINDANAO STATE UNIVERSITY', 'Marawi City'];
// Name printed above the signature line. Leave '' to print a blank line for hand-writing.
const SIGNATORY_NAME = '';
const SIGNATORY_TITLE = 'President';

// Leave types listed on the CSC form (item 6.A). A leave type that matches none
// of these is written on the "Others" line.
const LEAVE_TYPE_OPTIONS: { label: string; match: string[] }[] = [
  { label: 'Vacation Leave', match: ['vacation'] },
  { label: 'Mandatory/Forced Leave', match: ['mandatory', 'forced'] },
  { label: 'Sick Leave', match: ['sick'] },
  { label: 'Maternity Leave', match: ['maternity'] },
  { label: 'Paternity Leave', match: ['paternity'] },
  { label: 'Special Privilege Leave', match: ['special privilege'] },
  { label: 'Solo Parent Leave', match: ['solo parent'] },
  { label: 'Study Leave', match: ['study'] },
  { label: '10-Day VAWC Leave', match: ['vawc'] },
  { label: 'Rehabilitation Privilege', match: ['rehabilitation'] },
  { label: 'Special Emergency (Calamity) Leave', match: ['special emergency', 'calamity'] },
  { label: 'Adoption Leave', match: ['adoption'] },
];

// ---------------------------------------------------------------------------
// Print CSS. The form is printed from its own copy attached directly to <body>
// (see the portal below), and everything else on the page is hidden while
// printing. This is what makes printing work from inside the side panel/dialog,
// which used to print as a blank page.
// ---------------------------------------------------------------------------
const PRINT_CSS = `
  @media screen {
    #leave-form-print-portal { display: none; }
  }
  @media print {
    @page { margin: 10mm; }
    html, body { background: #fff !important; }
    body > *:not(#leave-form-print-portal) { display: none !important; }
    #leave-form-print-portal { display: block !important; }
  }
`;

const exactColor = {
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
} as React.CSSProperties;

interface ApprovalTrailEntry {
  approver_role: string;
  action: string;
  remarks?: string | null;
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
  leave_location?: string | null;
  start_date: string;
  end_date: string;
  // Postgres NUMERIC comes back as a string (e.g. "4.00"), so never add it directly.
  days_count: number | string;
  reason?: string | null;
  status: string;
  created_at: string;
  monetize_credits?: boolean | string | number | null;
  commutation_requested?: boolean | string | number | null;
  monetization_vl_days?: number | string | null;
  monetization_sl_days?: number | string | null;
  hr_remarks?: string | null;
  ovcaa_remarks?: string | null;
  ovcaf_remarks?: string | null;
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

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const isTrue = (v: unknown): boolean =>
  v === true || v === 't' || v === 'true' || v === '1' || v === 1;

const fmtDays = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(2));

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatPeso = (amount: number): string =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);

const safeJson = async (res: Response | null): Promise<any> => {
  try {
    return res ? await res.json() : null;
  } catch {
    return null;
  }
};

// A labelled box on the form (e.g. "1. OFFICE/DEPARTMENT")
function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-1.5 ${className}`}>
      <p className="text-[9px] font-semibold uppercase">{label}</p>
      <div className="font-semibold min-h-[16px]">{children}</div>
    </div>
  );
}

// A checkbox with a label
function Check({ checked, children }: { checked?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5 py-[1px]">
      <span className="inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 mt-[1px] border border-black text-[10px] leading-none font-bold">
        {checked ? '✓' : ''}
      </span>
      <span>{children}</span>
    </div>
  );
}

// An underlined blank that can hold text
function Line({ children, minWidth = 90 }: { children?: React.ReactNode; minWidth?: number }) {
  return (
    <span className="inline-block border-b border-black px-1 align-bottom" style={{ minWidth }}>
      {children}
      {' '}
    </span>
  );
}

function SignLine({ name, caption }: { name?: string; caption: string }) {
  return (
    <div className="mt-7 text-center">
      <p className="font-semibold uppercase min-h-[16px]">{name || ' '}</p>
      <div className="border-t border-black mx-3 pt-0.5 text-[10px]">{caption}</div>
    </div>
  );
}

export default function PrintableLeaveForm({
  applicationId,
  showPrintButton = true,
}: PrintableLeaveFormProps) {
  const [application, setApplication] = useState<LeaveApplication | null>(null);
  const [trail, setTrail] = useState<ApprovalTrailEntry[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [salary, setSalary] = useState<number | null>(null);
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
          const app: LeaveApplication = detailsData.application;
          setApplication(app);
          setTrail(detailsData.history || []);

          // Leave credits + monthly salary. Either may fail without breaking the form.
          const [balRes, salRes] = await Promise.all([
            fetch(`${API_BASE_URL}/leave/balance/${app.employee_id}`, { headers: getHeaders() }).catch(() => null),
            fetch(`${API_BASE_URL}/leave/salary/${app.employee_id}`, { headers: getHeaders() }).catch(() => null),
          ]);
          const balData = await safeJson(balRes);
          if (balData?.success && balData.balance) {
            setBalance({
              vacationLeave: toNum(balData.balance.vacationLeave),
              sickLeave: toNum(balData.balance.sickLeave),
            });
          }
          const salData = await safeJson(salRes);
          if (salData?.success && toNum(salData.monthly_salary) > 0) {
            setSalary(toNum(salData.monthly_salary));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

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

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------
  const findApprover = (role: string) => trail.find((t) => t.approver_role === role);
  const hrEntry = findApprover('hr');
  const ovcaaEntry = findApprover('ovcaa');
  const ovcafEntry = findApprover('ovcaf');

  const type = (application.leave_type || '').toLowerCase();
  const days = toNum(application.days_count);
  const isVacationType = type.includes('vacation');
  const isSickType = type.includes('sick');
  const monetized = isTrue(application.monetize_credits);
  const commutation = isTrue(application.commutation_requested);
  const status = application.status || '';
  const isApproved = status === 'approved';
  const isRejected = status.includes('rejected');

  // Item 6.A — which leave type is checked
  const matchedIndex = LEAVE_TYPE_OPTIONS.findIndex((o) => o.match.some((m) => type.includes(m)));
  const othersText = matchedIndex === -1 ? application.leave_type : '';

  // Item 6.B — location only applies to Vacation / Special Privilege Leave
  const showLocation = isVacationType || type.includes('special privilege');
  const withinPh = showLocation && application.leave_location === 'within_ph';
  const abroad = showLocation && application.leave_location === 'abroad';

  // Item 7.A — certification of leave credits.
  // The database balance already reflects this application once it is fully
  // approved, so "Total Earned" is rebuilt as current balance + what this
  // application used. Before final approval the balance is not yet deducted, so
  // the current balance is the total earned. (Display only — the database
  // balance remains the source of truth.)
  const monetVl = monetized ? toNum(application.monetization_vl_days) : 0;
  const monetSl = monetized ? toNum(application.monetization_sl_days) : 0;
  const vlUsed = (isVacationType ? days : 0) + monetVl;
  const slUsed = (isSickType ? days : 0) + monetSl;
  const alreadyDeducted = isApproved && !commutation;

  const curVl = balance?.vacationLeave ?? 0;
  const curSl = balance?.sickLeave ?? 0;
  const vlEarned = alreadyDeducted ? curVl + vlUsed : curVl;
  const slEarned = alreadyDeducted ? curSl + slUsed : curSl;
  const vlBalance = alreadyDeducted ? curVl : Math.max(curVl - vlUsed, 0);
  const slBalance = alreadyDeducted ? curSl : Math.max(curSl - slUsed, 0);
  const creditsKnown = balance !== null;
  const credit = (n: number) => (creditsKnown ? n.toFixed(2) : '');
  const usedCell = (n: number) => (n > 0 ? n.toFixed(2) : '-');

  // Items 7.C / 7.D
  const rejectedEntry = trail.find((t) => t.action === 'rejected');
  const disapprovalReason = isRejected
    ? rejectedEntry?.remarks || application.ovcaf_remarks || application.ovcaa_remarks || application.hr_remarks || ''
    : '';

  const processedBy = [
    hrEntry ? `HR: ${hrEntry.approver_name} (${formatDate(hrEntry.created_at)})` : '',
    ovcaaEntry ? `OVCAA: ${ovcaaEntry.approver_name} (${formatDate(ovcaaEntry.created_at)})` : '',
    ovcafEntry ? `OVCAF: ${ovcafEntry.approver_name} (${formatDate(ovcafEntry.created_at)})` : '',
  ].filter(Boolean);

  // -------------------------------------------------------------------------
  // The form itself (CSC Form No. 6). Rendered once for the on-screen preview
  // and once, hidden, in the print-only copy below.
  // -------------------------------------------------------------------------
  const formBody = (
    <div className="bg-white text-black text-[11px] leading-snug">
      <div className="flex justify-between items-start text-[10px] mb-1">
        <div>
          <p className="font-bold">Civil Service Form No. 6</p>
          <p>Revised 2020</p>
        </div>
        <p className="text-right">
          Application No. <span className="font-semibold">{application.application_number}</span>
        </p>
      </div>

      <div className="text-center mb-2">
        {LETTERHEAD_LINES.map((line, i) => (
          <p key={i} className={i === 1 ? 'font-bold' : 'text-[10px]'}>{line}</p>
        ))}
        <p className="text-base font-bold tracking-wide mt-1">APPLICATION FOR LEAVE</p>
      </div>

      <div className="border border-black">
        {/* 1 – 2 */}
        <div className="grid grid-cols-2">
          <Field label="1. Office / Department">{application.department}</Field>
          <Field label="2. Name" className="border-l border-black">
            {(application.employee_name || '').toUpperCase()}
          </Field>
        </div>

        {/* 3 – 5 */}
        <div className="grid grid-cols-3 border-t border-black">
          <Field label="3. Date of Filing">{formatDate(application.created_at)}</Field>
          <Field label="4. Position" className="border-l border-black">{application.position}</Field>
          <Field label="5. Salary" className="border-l border-black">
            {salary ? formatPeso(salary) : ''}
          </Field>
        </div>

        {/* 6 */}
        <div
          className="border-t border-black bg-gray-100 text-center font-bold py-0.5"
          style={exactColor}
        >
          6. DETAILS OF APPLICATION
        </div>

        <div className="grid grid-cols-2 border-t border-black">
          {/* 6.A */}
          <div className="p-1.5">
            <p className="font-semibold mb-1">6.A TYPE OF LEAVE TO BE AVAILED OF</p>
            {LEAVE_TYPE_OPTIONS.map((o, i) => (
              <Check key={o.label} checked={matchedIndex === i}>{o.label}</Check>
            ))}
            <Check checked={matchedIndex === -1}>
              Others (Specify): <Line minWidth={110}>{othersText}</Line>
            </Check>
          </div>

          {/* 6.B */}
          <div className="p-1.5 border-l border-black">
            <p className="font-semibold mb-1">6.B DETAILS OF LEAVE</p>

            <p className="italic text-[10px]">In case of Vacation/Special Privilege Leave:</p>
            <Check checked={withinPh}>Within the Philippines</Check>
            <Check checked={abroad}>Abroad (Specify) <Line minWidth={90} /></Check>

            <p className="italic text-[10px] mt-1.5">In case of Sick Leave:</p>
            <Check>In Hospital (Specify Illness) <Line minWidth={60} /></Check>
            <Check>Out Patient (Specify Illness) <Line minWidth={60} /></Check>

            <p className="italic text-[10px] mt-1.5">In case of Study Leave:</p>
            <Check>Completion of Master&apos;s Degree</Check>
            <Check>BAR/Board Examination Review</Check>

            <p className="italic text-[10px] mt-1.5">Other purpose:</p>
            <Check checked={monetized}>Monetization of Leave Credits</Check>
            <Check checked={type.includes('terminal')}>Terminal Leave</Check>

            {application.reason ? (
              <p className="mt-1.5">
                <span className="font-semibold">Reason: </span>
                {application.reason}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-black">
          {/* 6.C */}
          <div className="p-1.5">
            <p className="font-semibold mb-1">6.C NUMBER OF WORKING DAYS APPLIED FOR</p>
            <p className="font-semibold">
              <Line minWidth={110}>{fmtDays(days)}</Line>
            </p>
            <p className="font-semibold mt-1.5">INCLUSIVE DATES</p>
            <p className="font-semibold">
              <Line minWidth={180}>
                {formatDate(application.start_date)} – {formatDate(application.end_date)}
              </Line>
            </p>
          </div>

          {/* 6.D */}
          <div className="p-1.5 border-l border-black">
            <p className="font-semibold mb-1">6.D COMMUTATION</p>
            <Check checked={!commutation}>Not Requested</Check>
            <Check checked={commutation}>Requested</Check>
            <SignLine caption="(Signature of Applicant)" />
          </div>
        </div>

        {/* 7 */}
        <div
          className="border-t border-black bg-gray-100 text-center font-bold py-0.5"
          style={exactColor}
        >
          7. DETAILS OF ACTION ON APPLICATION
        </div>

        <div className="grid grid-cols-2 border-t border-black">
          {/* 7.A */}
          <div className="p-1.5">
            <p className="font-semibold mb-0.5">7.A CERTIFICATION OF LEAVE CREDITS</p>
            <p className="text-[10px] mb-1">As of {formatDate(new Date().toISOString())}</p>
            <table className="w-full border-collapse text-center text-[10px]">
              <thead>
                <tr>
                  <th className="border border-black p-0.5"></th>
                  <th className="border border-black p-0.5 font-semibold">Vacation Leave</th>
                  <th className="border border-black p-0.5 font-semibold">Sick Leave</th>
                  <th className="border border-black p-0.5 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-0.5 text-left">Total Earned</td>
                  <td className="border border-black p-0.5">{credit(vlEarned)}</td>
                  <td className="border border-black p-0.5">{credit(slEarned)}</td>
                  <td className="border border-black p-0.5">{credit(vlEarned + slEarned)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-0.5 text-left">Less this application</td>
                  <td className="border border-black p-0.5">{usedCell(vlUsed)}</td>
                  <td className="border border-black p-0.5">{usedCell(slUsed)}</td>
                  <td className="border border-black p-0.5">{usedCell(vlUsed + slUsed)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-0.5 text-left font-semibold">Balance</td>
                  <td className="border border-black p-0.5 font-semibold">{credit(vlBalance)}</td>
                  <td className="border border-black p-0.5 font-semibold">{credit(slBalance)}</td>
                  <td className="border border-black p-0.5 font-semibold">{credit(vlBalance + slBalance)}</td>
                </tr>
              </tbody>
            </table>
            <SignLine name={hrEntry?.approver_name} caption="(Authorized Officer — HR)" />
          </div>

          {/* 7.B */}
          <div className="p-1.5 border-l border-black">
            <p className="font-semibold mb-1">7.B RECOMMENDATION</p>
            <Check checked={ovcaaEntry?.action === 'approved'}>For approval</Check>
            <Check checked={ovcaaEntry?.action === 'rejected'}>
              For disapproval due to{' '}
              <Line minWidth={110}>{ovcaaEntry?.action === 'rejected' ? ovcaaEntry.remarks : ''}</Line>
            </Check>
            <SignLine name={ovcaaEntry?.approver_name} caption="(Authorized Officer — OVCAA)" />
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-black">
          {/* 7.C */}
          <div className="p-1.5">
            <p className="font-semibold mb-1">7.C APPROVED FOR:</p>
            <div className="py-[1px]">
              <Line minWidth={40}>{isApproved ? fmtDays(days) : ''}</Line> days with pay
            </div>
            <div className="py-[1px]">
              <Line minWidth={40} /> days without pay
            </div>
            <div className="py-[1px]">
              <Line minWidth={40} /> others (Specify) <Line minWidth={70} />
            </div>
          </div>

          {/* 7.D */}
          <div className="p-1.5 border-l border-black">
            <p className="font-semibold mb-1">7.D DISAPPROVED DUE TO:</p>
            <div className="border-b border-black min-h-[16px] px-1">{disapprovalReason}</div>
            <div className="border-b border-black min-h-[16px] mt-1">{' '}</div>
          </div>
        </div>

        {/* Final signature — President / authorized official */}
        <div className="border-t border-black p-1.5">
          <div className="mx-auto w-72">
            <SignLine
              name={SIGNATORY_NAME}
              caption={`(${SIGNATORY_TITLE} / Authorized Official)`}
            />
          </div>
        </div>
      </div>

      {processedBy.length > 0 && (
        <p className="mt-1.5 text-[9px] text-gray-600">
          Processed in LEVIFY — {processedBy.join(' · ')}
        </p>
      )}
    </div>
  );

  return (
    <div id="printable-leave-form-root">
      <style>{PRINT_CSS}</style>

      {showPrintButton && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      )}

      {/* On-screen preview */}
      <div className="rounded-lg border bg-white p-4 shadow-sm overflow-x-auto">{formBody}</div>

      {/* Print-only copy, attached straight to <body> so printing never depends on
          the side panel / dialog this component is shown in. */}
      {createPortal(<div id="leave-form-print-portal">{formBody}</div>, document.body)}
    </div>
  );
}