import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';

const PRIMARY = '#7C2D3A';
// Lighter maroon for the portion of VL/SL that is beyond the 60-day reference.
const BEYOND = '#D9B3BA';

// Info (blue) colors for the banner and badge.
const INFO_BG = '#EAF2FB';
const INFO_BORDER = '#B5D4F4';
const INFO_TEXT = '#0C447C';

// LEVIFY reference threshold for VL/SL. This is a system setting,
// not a forfeiture limit: credits above it stay accumulated.
const REFERENCE_DAYS = 60;

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

  // accumulates = true for VL/SL (credits carry over, no forfeiture).
  const leaveTypes = [
    { name: 'Vacation Leave',          sub: 'Earns 1.25 days/month', value: vl,  max: REFERENCE_DAYS, accumulates: true  },
    { name: 'Sick Leave',              sub: 'Earns 1.25 days/month', value: sl,  max: REFERENCE_DAYS, accumulates: true  },
    { name: 'Special Privilege Leave', sub: '3 days per year',        value: spl, max: 3,              accumulates: false },
    { name: 'Forced Leave',            sub: '5 days per year',        value: fl,  max: 5,              accumulates: false },
  ];

  const hasBeyondReference = leaveTypes.some((l) => l.accumulates && l.value > l.max);

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

      {/* ── Info banner (beyond 60-day reference) ── */}
      {hasBeyondReference && (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg px-4 py-3"
          style={{ backgroundColor: INFO_BG, border: `1px solid ${INFO_BORDER}` }}
        >
          <span className="text-base">ℹ️</span>
          <p className="text-sm" style={{ color: INFO_TEXT }}>
            Your leave credits exceed {REFERENCE_DAYS} days. Credits above {REFERENCE_DAYS} days
            remain accumulated and are not forfeited.
          </p>
        </div>
      )}

      {/* ── Leave Credits Details ── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Leave Credits Details</CardTitle>
          <CardDescription>
            Breakdown of your leave credits by type (CSC Omnibus Rules on Leave)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Legend — bars show the current available balance per type */}
          <div className="flex gap-5 mb-6 flex-wrap">
            {[
              { color: PRIMARY,   label: 'Available' },
              { color: BEYOND,    label: `Beyond ${REFERENCE_DAYS} days` },
              { color: '#E5E7EB', label: 'Room left' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Leave rows */}
          <div className="space-y-6">
            {leaveTypes.map((leave) => {
              const isBeyond  = leave.accumulates && leave.value > leave.max;
              const isFull    = !isBeyond && leave.value === leave.max;
              const pct       = Math.min((leave.value / leave.max) * 100, 100);
              const basePct   = isBeyond ? (leave.max / leave.value) * 100 : pct;
              const beyondAmt = isBeyond ? (leave.value - leave.max).toFixed(2) : null;

              return (
                <div key={leave.name}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{leave.name}</span>
                        {isBeyond && (
                          <span
                            className="text-xs font-semibold rounded-full px-2 py-0.5"
                            style={{ backgroundColor: INFO_BG, color: INFO_TEXT }}
                          >
                            Beyond {REFERENCE_DAYS} days
                          </span>
                        )}
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

                  {/* Progress bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F0F0F0' }}>
                    {isBeyond ? (
                      <div className="flex h-full">
                        <div style={{ width: `${basePct}%`, backgroundColor: PRIMARY, borderRadius: '4px 0 0 4px' }} />
                        <div style={{ flex: 1, backgroundColor: BEYOND, borderRadius: '0 4px 4px 0' }} />
                      </div>
                    ) : (
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: PRIMARY, borderRadius: '4px' }} />
                    )}
                  </div>

                  {isBeyond ? (
                    <div className="flex justify-between mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: PRIMARY, display: 'inline-block' }} />
                        {leave.max}-day reference
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: BEYOND, display: 'inline-block' }} />
                        {beyondAmt} accumulated
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-right mt-1" style={{ color: '#aaa' }}>
                      {pct.toFixed(0)}% of {leave.max} days
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Monetization is subject to CSC rules and agency approval.
          </p>
        </CardContent>
      </Card>

      <div className="h-6" />
    </DashboardLayout>
  );
}