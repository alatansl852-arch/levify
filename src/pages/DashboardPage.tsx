import React, { useEffect, useState } from 'react';
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
  FileText, CheckCircle,
  ArrowRight,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

function HRDashboard() {
  const { getPendingRequests, allRequests, refreshRequests, refreshAllRequests, isLoading } = useLeave();

  useEffect(() => {
    refreshRequests();
    refreshAllRequests();
  }, [refreshRequests, refreshAllRequests]);

  const pendingRequests = getPendingRequests('hr') || [];
  const recentPending    = pendingRequests.slice(0, 5);

  const now = new Date();
  const approvedThisMonth = allRequests.filter((r) => {
    if (r.status !== 'approved') return false;
    const updated = r.updatedAt ? new Date(r.updatedAt) : new Date(r.createdAt);
    return updated.getFullYear() === now.getFullYear() && updated.getMonth() === now.getMonth();
  }).length;

  return (
    <>
      <PageHeader title="HR Dashboard" description="Human Resource Management Office - Leave Administration">
        <Button asChild>
          <Link to="/pending-requests">
            View All Pending
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Pending Requests"    value={pendingRequests.length} description="awaiting HR review"  variant="primary" />
        <StatCard title="Total Employees"     value={200}                    description="faculty and staff"   variant="primary" />
        <StatCard title="Approved This Month" value={approvedThisMonth}      description="leave requests"      variant="primary" />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Leave Requests</CardTitle>
              <CardDescription>Requests awaiting your review and validation</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pending-requests">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : recentPending.length > 0 ? (
              <div className="space-y-3">
                {recentPending.map((request) => (
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
              <div className="text-center py-8 text-muted-foreground">
                <p>No pending requests at this time</p>
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