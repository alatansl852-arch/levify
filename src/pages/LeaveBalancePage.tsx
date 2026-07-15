import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, CheckCircle, Calendar } from 'lucide-react';

const PRIMARY  = '#7C2D3A';
const OVER_CAP = '#F59E0B';

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
  const totalEarned = balance?.totalEarned ?? (vl + sl + spl + fl);
  const available   = totalEarned - totalUsed;

  return (
    <DashboardLayout>
      <PageHeader
        title="Leave Balance"
        description="Track your leave credits and accrual rates"
      />

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-3xl font-bold text-primary">{totalEarned.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">days</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Used</p>
                {/* ✅ FIXED: now shows 2.00 instead of 2 */}
                <p className="text-3xl font-bold text-primary">{totalUsed.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">days</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-3xl font-bold text-primary">{available.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">days</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Accrual</p>
                <p className="text-3xl font-bold text-primary">2.50</p>
                <p className="text-sm text-muted-foreground">VL + SL</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* ── Computation Reference ── */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Credit Computation Reference</CardTitle>
          <CardDescription>
            Based on CSC guidelines for vacation and sick leave earned per days/months of service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {['No. of Days', 'VAC', 'SICK', 'No. of Months', 'VAC', 'SICK'].map((h, i) => (
                    <th key={i} className="p-2 text-center text-xs font-bold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { days: '1',  vacD: '0.042', sickD: '0.042', months: '1',  vacM: '1.25',  sickM: '1.25'  },
                  { days: '5',  vacD: '0.208', sickD: '0.208', months: '3',  vacM: '3.75',  sickM: '3.75'  },
                  { days: '10', vacD: '0.417', sickD: '0.417', months: '6',  vacM: '7.50',  sickM: '7.50'  },
                  { days: '15', vacD: '0.625', sickD: '0.625', months: '9',  vacM: '11.25', sickM: '11.25' },
                  { days: '20', vacD: '0.833', sickD: '0.833', months: '12', vacM: '15.00', sickM: '15.00' },
                  { days: '24', vacD: '1.000', sickD: '1.000', months: '-',  vacM: '-',     sickM: '-'     },
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#FAFAFA' : '#fff' }}>
                    {[row.days, row.vacD, row.sickD, row.months, row.vacM, row.sickM].map((cell, j) => (
                      <td key={j} className="p-2 text-center text-xs text-gray-600">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="h-6" />
    </DashboardLayout>
  );
}