import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getLeaveTypeLabel, formatDate } from '@/lib/leave-utils';
import {
  FileText, Calendar, CheckCircle, Clock,
  TrendingUp, Users, AlertCircle, Wallet,
  ArrowRight, BookOpen, MinusCircle, Award,
} from 'lucide-react';

// ✅ FIX: Hook is defined outside — always called at top level of each component
function useLiveBalance(employeeId: string | undefined) {
  const [liveBalance, setLiveBalance] = useState<{
    totalLeaveAvailed: number;
    totalLeaveCredits: number;
  } | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    fetch(`/api/leave/balance/${employeeId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setLiveBalance({
            totalLeaveAvailed: data.balance.totalLeaveAvailed ?? data.balance.totalUsed ?? 0,
            totalLeaveCredits: data.balance.totalLeaveCredits ?? 0,
          });
        }
      })
      .catch((err) => console.error('❌ Failed to fetch live balance:', err));
  }, [employeeId]);

  return liveBalance;
}

function EmployeeDashboard({ employeeId }: { employeeId: string }) {
  const { user } = useAuth();
  const { getEmployeeLeaveBalance, getEmployeeLeaveHistory, refreshBalance, isLoading } = useLeave();

  // ✅ FIX: Hook always called at top level — not inside a condition
  const liveBalance = useLiveBalance(employeeId);

  // ✅ FIX: Balance was only ever fetched once at login (in LeaveContext's mount effect),
  // so it went stale after approvals happened elsewhere. Refresh every time this page mounts.
  useEffect(() => {
    if (employeeId) {
      refreshBalance(employeeId);
    }
  }, [employeeId, refreshBalance]);

  if (!user) return <div>Loading...</div>;

  const balance        = getEmployeeLeaveBalance(user.employeeId);
  const history        = getEmployeeLeaveHistory(user.employeeId) || [];
  const recentRequests = history.slice(0, 3);
  const pendingCount   = history.filter((r) => r.status === 'pending').length;

  const totalLeaveAvailed = liveBalance?.totalLeaveAvailed ?? user.total_leave_availed ?? 0;
  const totalLeaveCredits = liveBalance?.totalLeaveCredits ?? user.total_leave_credits ?? 0;
  const salaryGrade       = user.salary_grade ?? 0;

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

      {/* Row 1 — 4 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Vacation Leave"   value={balance?.vacationLeave?.toFixed(2) || '0.00'} description="days available"    icon={Calendar}    variant="primary" />
        <StatCard title="Sick Leave"       value={balance?.sickLeave?.toFixed(2)     || '0.00'} description="days available"    icon={CheckCircle} variant="primary" />
        <StatCard title="Pending Requests" value={pendingCount}                                  description="awaiting approval" icon={Clock}       variant="primary" />
        <StatCard title="Total Used"       value={(balance?.totalUsed || 0).toFixed(2)}          description="days this year"    icon={TrendingUp}  variant="primary" />
      </div>

      {/* Row 2 — 3 cards */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <StatCard title="Total Leave Credits" value={Number(totalLeaveCredits).toFixed(2)} description="lifetime credits earned"     icon={BookOpen}    variant="primary" />
        <StatCard title="Total Leave Availed" value={Number(totalLeaveAvailed).toFixed(2)} description="total days used / monetized" icon={MinusCircle} variant="primary" />
        <StatCard title="Salary Grade"        value={`SG - ${salaryGrade}`}                description="current salary grade"        icon={Award}       variant="primary" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent Leave Requests */}
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

        {/* Leave Balance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leave Balance Summary</CardTitle>
            <CardDescription>Your current leave credit balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Vacation Leave',    value: balance?.vacationLeave?.toFixed(2) || '0.00' },
                { label: 'Sick Leave',        value: balance?.sickLeave?.toFixed(2)     || '0.00' },
                { label: 'Special Privilege', value: String(balance?.specialPrivilege   || 3)     },
                { label: 'Forced Leave',      value: String(balance?.forcedLeave        || 5)     },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-semibold text-primary">{item.value} days</span>
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total Available</span>
                  <span className="text-lg text-primary">
                    {balance?.totalEarned?.toFixed(2) || '0.00'} days
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Leave Credits (Lifetime)</span>
                  <span className="font-medium">{Number(totalLeaveCredits).toFixed(2)} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Leave Availed / Monetized</span>
                  <span className="font-medium">{Number(totalLeaveAvailed).toFixed(2)} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Salary Grade</span>
                  <span className="font-medium">SG - {salaryGrade}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function HRDashboard() {
  const { getPendingRequests, leaveRequests, isLoading } = useLeave();
  const pendingRequests   = getPendingRequests('hr') || [];
  const recentPending     = pendingRequests.slice(0, 5);
  const approvedThisMonth = leaveRequests.filter(r =>
    r.status === 'approved' || r.status === 'hr_approved' || r.status === 'ovcaa_approved'
  ).length;

  return (
    <>
      <PageHeader title="HR Dashboard" description="Human Resource Management Office - Leave Administration">
        <Button asChild>
          <Link to="/pending-requests">
            <FileText className="mr-2 h-4 w-4" />
            View All Pending
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Requests"    value={pendingRequests.length} description="awaiting HR review"  icon={Clock}       variant="primary" />
        <StatCard title="Processed Today"     value={0}                      description="requests reviewed"   icon={CheckCircle} variant="primary" />
        <StatCard title="Total Employees"     value={200}                    description="faculty and staff"   icon={Users}       variant="primary" />
        <StatCard title="Approved This Month" value={approvedThisMonth}      description="leave requests"      icon={TrendingUp}  variant="primary" />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Leave Requests</CardTitle>
              <CardDescription>Requests awaiting your review and validation</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pending-requests">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
                <CheckCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
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
  const { getPendingRequests, leaveRequests } = useLeave();
  const pendingRequests = getPendingRequests('ovcaa') || [];
  const facultyRequests = leaveRequests.filter(r => r.department?.includes('College')) || [];

  return (
    <>
      <PageHeader title="OVCAA Dashboard" description="Office of the Vice Chancellor for Academic Affairs" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="For Academic Review"    value={pendingRequests.length}                                         description="HR-approved requests" icon={FileText}    variant="primary" />
        <StatCard title="Faculty Leave Requests" value={facultyRequests.length}                                         description="this month"           icon={Users}       variant="primary" />
        <StatCard title="Endorsed"               value={leaveRequests.filter(r => r.status === 'ovcaa_approved').length} description="to OVCAF"            icon={CheckCircle} variant="primary" />
        <StatCard title="Returned"               value={0}                                                              description="for revision"         icon={AlertCircle} variant="primary" />
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
  const { getPendingRequests, leaveRequests } = useLeave();
  const pendingRequests      = getPendingRequests('ovcaf') || [];
  const monetizationRequests = leaveRequests.filter(r => r.isMonetization) || [];

  return (
    <>
      <PageHeader title="OVCAF Dashboard" description="Office of the Vice Chancellor for Administration and Finance" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="For Final Approval"    value={pendingRequests.length}                                    description="OVCAA-endorsed requests" icon={FileText}    variant="primary" />
        <StatCard title="Monetization Requests" value={monetizationRequests.length}                               description="pending review"          icon={Wallet}      variant="primary" />
        <StatCard title="Approved"              value={leaveRequests.filter(r => r.status === 'approved').length} description="this month"              icon={CheckCircle} variant="primary" />
        <StatCard title="Compliance Issues"     value={0}                                                         description="flagged requests"        icon={AlertCircle} variant="primary" />
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
            {monetizationRequests.length > 0 ? (
              <div className="space-y-3">
                {monetizationRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{request.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.monetizationDays} days for monetization
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
      {/* ✅ FIX: Pass employeeId as prop so EmployeeDashboard can call useLiveBalance at its own top level */}
      {(user.role === 'staff' || user.role === 'faculty') && <EmployeeDashboard employeeId={user.employeeId} />}
      {user.role === 'hr'    && <HRDashboard />}
      {user.role === 'ovcaa' && <OVCAADashboard />}
      {user.role === 'ovcaf' && <OVCAFDashboard />}
    </DashboardLayout>
  );
}