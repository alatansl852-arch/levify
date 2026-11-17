import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';

const PRIMARY = '#7C2D3A';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Whole numbers show without decimals (5), real fractions keep 2 decimals (5.50).
function formatWholeOrDecimal(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

// Same live-balance fetch used on the Dashboard — pulls the lifetime
// "Total Leave Credits" number that isn't part of the LeaveContext balance shape.
// It's no longer displayed as its own card, but Available is computed from it.
function useLifetimeCredits(employeeId: string | undefined) {
  const [totalLeaveCredits, setTotalLeaveCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    fetch(`${API_BASE_URL}/leave/balance/${employeeId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('levify_token')}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTotalLeaveCredits(data.balance.totalLeaveCredits ?? 0);
        }
      })
      .catch((err) => console.error('❌ Failed to fetch lifetime credits:', err));
  }, [employeeId]);

  return totalLeaveCredits;
}

interface LeaveRow {
  name: string;
  sub: string;
  value: number;
  // accumulates = VL/SL: credits carry over with no maximum, so no bar is drawn.
  // Otherwise `max` is the annual limit (Special Privilege 3, Forced 5).
  accumulates: boolean;
  max: number;
}

export default function LeaveBalancePage() {
  const { user } = useAuth();
  const { getEmployeeLeaveBalance, refreshBalance } = useLeave();

  // Refresh the balance every time this page mounts so it never goes stale
  // after approvals happen elsewhere.
  useEffect(() => {
    if (user?.employeeId) {
      refreshBalance(user.employeeId);
    }
  }, [user?.employeeId, refreshBalance]);

  const balance = user ? getEmployeeLeaveBalance(user.employeeId) : undefined;
  const totalLeaveCredits = useLifetimeCredits(user?.employeeId);

  const vl  = balance?.vacationLeave    ?? 0;
  const sl  = balance?.sickLeave        ?? 0;
  const spl = balance?.specialPrivilege ?? 0;
  const fl  = balance?.forcedLeave      ?? 0;
  const totalAvailed = balance?.totalUsed ?? 0;

  const leaveTypes: LeaveRow[] = [
    { name: 'Vacation Leave',          sub: 'Earns 1.25 days/month', value: vl,  accumulates: true,  max: 0 },
    { name: 'Sick Leave',              sub: 'Earns 1.25 days/month', value: sl,  accumulates: true,  max: 0 },
    { name: 'Special Privilege Leave', sub: '3 days per year',        value: spl, accumulates: false, max: 3 },
    { name: 'Forced Leave',            sub: '5 days per year',        value: fl,  accumulates: false, max: 5 },
  ];

  // Available = Total Leave Credits − Total Availed
  const available = (totalLeaveCredits ?? 0) - totalAvailed;

  return (
    <DashboardLayout>
      <PageHeader
        title="Leave Balance"
        description="Track your leave credits and accrual rates"
      />

      {/* ── Summary Cards — Total Availed + Available ── */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <StatCard
          title="Total Availed"
          value={formatWholeOrDecimal(totalAvailed)}
          description="days"
          variant="primary"
        />
        <StatCard
          title="Available"
          value={totalLeaveCredits !== null ? available.toFixed(2) : '—'}
          description="days"
          variant="primary"
        />
      </div>

      {/* ── Leave Credits Details ── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Leave Credits Details</CardTitle>
          <CardDescription>
            Breakdown of your leave credits by type (CSC Omnibus Rules on Leave)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Leave rows */}
          <div className="space-y-6">
            {leaveTypes.map((leave) => {
              const isFull = !leave.accumulates && leave.value >= leave.max;
              const pct    = leave.accumulates ? 0 : Math.min((leave.value / leave.max) * 100, 100);

              return (
                <div key={leave.name}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{leave.name}</span>
                        {isFull && (
                          <span
                            className="text-xs font-semibold rounded-full px-2 py-0.5"
                            style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                          >
                            Full
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{leave.sub}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold" style={{ color: PRIMARY }}>
                        {leave.value.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {leave.accumulates ? 'days accumulated' : `of ${leave.max} max days`}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar — only for leave types with an annual limit */}
                  {!leave.accumulates && (
                    <>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F0F0F0' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: PRIMARY, borderRadius: '4px' }} />
                      </div>
                      <p className="text-xs text-right mt-1" style={{ color: '#aaa' }}>
                        {pct.toFixed(0)}% of {leave.max} days
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Vacation and sick leave credits are cumulative and carry over each year.
            Monetization is subject to CSC rules and agency approval.
          </p>
        </CardContent>
      </Card>

      <div className="h-6" />
    </DashboardLayout>
  );
}