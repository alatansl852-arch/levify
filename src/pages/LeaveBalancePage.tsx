import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';

const PRIMARY  = '#7C2D3A';
const OVER_CAP = '#F59E0B';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Same live-balance fetch used on the Dashboard — pulls the lifetime
// "Total Leave Credits" number that isn't part of the LeaveContext balance shape.
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

  // ✅ FIX: Balance was only ever fetched once at login (in LeaveContext's mount effect),
  // so it went stale after approvals happened elsewhere. Refresh every time this page mounts.
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
  const totalUsed = balance?.totalUsed  ?? 0;

  const leaveTypes = [
    { name: 'Vacation Leave',          sub: 'Earns 1.25 days/month', value: vl,  max: 60 },
    { name: 'Sick Leave',              sub: 'Earns 1.25 days/month', value: sl,  max: 60 },
    { name: 'Special Privilege Leave', sub: '3 days per year',        value: spl, max: 3  },
    { name: 'Forced Leave',            sub: '5 days per year',        value: fl,  max: 5  },
  ];

  const hasOverCap = leaveTypes.some(l => l.value > l.max);

  // Available is now derived from Total Leave Credits (the one official lifetime
  // number) instead of a separate "Total Earned" figure — having two similar-but-
  // different totals on screen was confusing people.
  const available = (totalLeaveCredits ?? 0) - totalUsed;

  return (
    <DashboardLayout>
      <PageHeader
        title="Leave Balance"
        description="Track your leave credits and accrual rates"
      />

      {/* ── Summary Cards — 3 cards, one meaning each ── */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="Total Leave Credits"
          value={totalLeaveCredits !== null ? totalLeaveCredits.toFixed(2) : '—'}
          description="lifetime earned"
          variant="primary"
        />
        <StatCard
          title="Total Used"
          value={totalUsed.toFixed(2)}
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

      {/* ── Over-cap warning ── */}
      {hasOverCap && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3">
          <span className="text-base">⚠️</span>
          <p className="text-sm text-yellow-800">
            You have leave days over the 60-day cap. Use them before they go to waste.
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
          {/* Legend */}
          <div className="flex gap-5 mb-6">
            {[
              { color: PRIMARY,   label: 'Used'      },
              { color: OVER_CAP,  label: 'Over cap'  },
              { color: '#E5E7EB', label: 'Remaining' },
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
              const isOver  = leave.value > leave.max;
              const isFull  = leave.value === leave.max;
              const pct     = Math.min((leave.value / leave.max) * 100, 100);
              const basePct = isOver ? (leave.max / leave.value) * 100 : pct;
              const overAmt = isOver ? (leave.value - leave.max).toFixed(2) : null;

              return (
                <div key={leave.name}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{leave.name}</span>
                        {isOver && (
                          <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            +{overAmt} over cap
                          </span>
                        )}
                        {isFull && !isOver && (
                          <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                            style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                            Full
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{leave.sub}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold" style={{ color: PRIMARY }}>{leave.value.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">of {leave.max} max days</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F0F0F0' }}>
                    {isOver ? (
                      <div className="flex h-full">
                        <div style={{ width: `${basePct}%`, backgroundColor: PRIMARY, borderRadius: '4px 0 0 4px' }} />
                        <div style={{ flex: 1, backgroundColor: OVER_CAP, borderRadius: '0 4px 4px 0' }} />
                      </div>
                    ) : (
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: PRIMARY, borderRadius: '4px' }} />
                    )}
                  </div>

                  <p className="text-xs text-right mt-1" style={{ color: isOver ? '#92400E' : '#aaa' }}>
                    {isOver
                      ? `+${overAmt} over ${leave.max}-day cap`
                      : `${pct.toFixed(0)}% of ${leave.max} days`}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="h-6" />
    </DashboardLayout>
  );
}