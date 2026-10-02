import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave, LeaveStatus } from '@/contexts/LeaveContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getLeaveTypeLabel, formatDate } from '@/lib/leave-utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FileText, CheckCircle,
  ArrowRight,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Maroon used for the HR dashboard chart + compact stat cards
const MAROON = '#7b1325';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonetizationRequest {
  id: number;
  employee_name: string;
  days_count: number;
  status: LeaveStatus;
}

// ✅ Hook now tracks used and monetized separately (backend split)
function useLiveBalance(employeeId: string | undefined) {
  const [liveBalance, setLiveBalance] = useState<{
    totalLeaveUsed: number;
    totalLeaveMonetized: number;
    totalLeaveCredits: number;
  } | null>(null);

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
          setLiveBalance({
            totalLeaveUsed:      data.balance.totalUsed ?? 0,
            totalLeaveMonetized: data.balance.totalMonetized ?? 0,
            totalLeaveCredits:   data.balance.totalLeaveCredits ?? 0,
          });
        }
      })
      .catch((err) => console.error('❌ Failed to fetch live balance:', err));
  }, [employeeId]);

  return liveBalance;
}

function EmployeeDashboard({ employeeId }: { employeeId: string }) {
  const { user } = useAuth();
  const { getEmployeeLeaveBalance, getEmployeeLeaveHistory, refreshBalance, refreshRequests, isLoading } = useLeave();

  const liveBalance = useLiveBalance(employeeId);

  useEffect(() => {
    if (employeeId) {
      refreshBalance(employeeId);
      refreshRequests();
    }
  }, [employeeId, refreshBalance, refreshRequests]);

  if (!user) return <div>Loading...</div>;

  const balance        = getEmployeeLeaveBalance(user.employeeId);
  const history        = getEmployeeLeaveHistory(user.employeeId) || [];
  const recentRequests = history.slice(0, 3);
  const pendingCount   = history.filter((r) => r.status === 'pending').length;

  const totalLeaveCredits = liveBalance?.totalLeaveCredits ?? user.total_leave_credits ?? 0;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name?.split(' ')[0] || 'User'}!`}
        description="Manage your leave requests and track your balances"
      >
        <Button asChild>
          <Link to="/apply-leave">
            <FileText className="mr-2 h-4 w-4" />
            Apply for Leave
          </Link>
        </Button>
      </PageHeader>

      {/* Summary — 4 cards, everything a person checks day-to-day */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Vacation Leave"
          value={balance?.vacationLeave?.toFixed(2) || '0.00'}
          description="days available"
          variant="primary"
        />
        <StatCard
          title="Sick Leave"
          value={balance?.sickLeave?.toFixed(2) || '0.00'}
          description="days available"
          variant="primary"
        />
        <StatCard
          title="Total Credits"
          value={Number(totalLeaveCredits).toFixed(2)}
          description="lifetime earned"
          variant="primary"
        />
        <StatCard
          title="Pending Requests"
          value={pendingCount}
          description="awaiting approval"
          variant="primary"
        />
      </div>

      {/* Recent Leave Requests — full width now that the duplicate
          "Leave Balance Summary" card (same numbers as the row above) is gone */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Leave Requests</CardTitle>
              <CardDescription>Your latest leave applications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leave-history">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{getLeaveTypeLabel(request.leaveType)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No leave requests yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Compact stat card used only on the HR dashboard
function CompactStat({
  title,
  value,
  description,
}: {
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: MAROON }}>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold leading-tight" style={{ color: MAROON }}>
            {value}
          </span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function HRDashboard() {
  const {
    getPendingRequests,
    allRequests,
    refreshRequests,
    refreshAllRequests,
    isLoadingAll,
  } = useLeave();

  useEffect(() => {
    refreshRequests();
    refreshAllRequests();
  }, [refreshRequests, refreshAllRequests]);

  const pendingRequests = getPendingRequests('hr') || [];

  const now = new Date();
  const approvedThisMonth = allRequests.filter((r) => {
    if (r.status !== 'approved') return false;
    const updated = r.updatedAt ? new Date(r.updatedAt) : new Date(r.createdAt);
    return updated.getFullYear() === now.getFullYear() && updated.getMonth() === now.getMonth();
  }).length;

  // Bar chart data: number of leave requests filed per month (current year)
  const monthlyData = useMemo(() => {
    const year = new Date().getFullYear();
    const counts: number[] = Array(12).fill(0);
    allRequests.forEach((r) => {
      const d = new Date(r.createdAt);
      if (d.getFullYear() === year) counts[d.getMonth()] += 1;
    });
    return MONTH_LABELS.map((month, i) => ({ month, requests: counts[i] }));
  }, [allRequests]);

  // Table data: latest 5 requests (any status)
  const recentRequests = useMemo(
    () =>
      [...allRequests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [allRequests]
  );

  return (
    <>
      <PageHeader title="HR Dashboard" description="Human Resource Management Office - Leave Administration">
        <Button asChild>
          <Link to="/pending-requests">
            View All Pending
          </Link>
        </Button>
      </PageHeader>

      {/* Compact stat cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <CompactStat title="Pending Requests"    value={pendingRequests.length} description="awaiting HR review" />
        <CompactStat title="Total Employees"     value={200}                    description="faculty and staff" />
        <CompactStat title="Approved This Month" value={approvedThisMonth}      description="leave requests" />
      </div>

      {/* Graph: Monthly Leave Requests */}
      <div className="mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Leave Requests</CardTitle>
            <CardDescription>Number of leave requests filed per month, {now.getFullYear()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: 'rgba(123, 19, 37, 0.08)' }}
                    formatter={(value: number) => [value, 'Requests']}
                  />
                  <Bar dataKey="requests" fill={MAROON} radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table: Recent Leave Requests */}
      <div className="mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Recent Leave Requests</CardTitle>
              <CardDescription>Latest leave activity from all employees</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/all-requests">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAll ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : recentRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Employee</th>
                      <th className="py-2 pr-4 font-medium">Department</th>
                      <th className="py-2 pr-4 font-medium">Leave Type</th>
                      <th className="py-2 pr-4 font-medium">Dates</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((request) => (
                      <tr key={request.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{request.employeeName}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{request.department}</td>
                        <td className="py-3 pr-4">{getLeaveTypeLabel(request.leaveType)}</td>
                        <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={request.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No leave requests yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function OVCAADashboard() {
  const { getPendingRequests, allRequests, refreshRequests, refreshAllRequests } = useLeave();

  useEffect(() => {
    refreshRequests();
    refreshAllRequests();
  }, [refreshRequests, refreshAllRequests]);

  const pendingRequests = getPendingRequests('ovcaa') || [];
  const facultyRequests = pendingRequests.filter((r) => r.department?.includes('College')) || [];

  const endorsedCount = allRequests.filter(
    (r) => r.status === 'ovcaa_approved' || r.status === 'approved'
  ).length;

  return (
    <>
      <PageHeader title="OVCAA Dashboard" description="Office of the Vice Chancellor for Academic Affairs" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="For Academic Review"    value={pendingRequests.length} description="HR-approved requests" variant="primary" />
        <StatCard title="Faculty Leave Requests" value={facultyRequests.length} description="this month"           variant="primary" />
        <StatCard title="Endorsed"               value={endorsedCount}          description="to OVCAF"            variant="primary" />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Academic Review</CardTitle>
            <CardDescription>Faculty leave requests requiring academic impact assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{request.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{request.department}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{getLeaveTypeLabel(request.leaveType)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending requests for academic review</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function OVCAFDashboard() {
  const { getPendingRequests, allRequests, refreshRequests, refreshAllRequests } = useLeave();
  const [monetizationCount, setMonetizationCount] = useState(0);
  const [monetizationList, setMonetizationList] = useState<MonetizationRequest[]>([]);

  useEffect(() => {
    refreshRequests();
    refreshAllRequests();

    const token = localStorage.getItem('levify_token');
    fetch(`${API_BASE_URL}/leave/monetization/ovcaf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMonetizationCount(data.applications.length);
          setMonetizationList(data.applications);
        }
      })
      .catch((err) => console.error('❌ Failed to fetch monetization requests:', err));
  }, [refreshRequests, refreshAllRequests]);

  const pendingRequests = getPendingRequests('ovcaf') || [];

  const now = new Date();
  const approvedThisMonth = allRequests.filter((r) => {
    if (r.status !== 'approved') return false;
    const updated = r.updatedAt ? new Date(r.updatedAt) : new Date(r.createdAt);
    return updated.getFullYear() === now.getFullYear() && updated.getMonth() === now.getMonth();
  }).length;

  return (
    <>
      <PageHeader title="OVCAF Dashboard" description="Office of the Vice Chancellor for Administration and Finance" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="For Final Approval"    value={pendingRequests.length} description="OVCAA-endorsed requests" variant="primary" />
        <StatCard title="Monetization Requests" value={monetizationCount}      description="pending review"          variant="primary" />
        <StatCard title="Approved"              value={approvedThisMonth}      description="this month"              variant="primary" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Final Approval</CardTitle>
            <CardDescription>Requests endorsed by OVCAA awaiting final approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{request.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{request.department}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending requests for final approval</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monetization Queue</CardTitle>
            <CardDescription>Leave credit monetization requests</CardDescription>
          </CardHeader>
          <CardContent>
            {monetizationList.length > 0 ? (
              <div className="space-y-3">
                {monetizationList.map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{request.employee_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.days_count} days for monetization
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No monetization requests</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {(user.role === 'staff' || user.role === 'faculty') && <EmployeeDashboard employeeId={user.employeeId} />}
      {user.role === 'hr'    && <HRDashboard />}
      {user.role === 'ovcaa' && <OVCAADashboard />}
      {user.role === 'ovcaf' && <OVCAFDashboard />}
    </DashboardLayout>
  );
}