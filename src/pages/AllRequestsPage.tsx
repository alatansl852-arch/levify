import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

interface Summary {
  totalRequests: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface ApprovalStep {
  leave_application_id: number;
  approver_role: 'hr' | 'ovcaa' | 'ovcaf';
  action: 'approved' | 'rejected';
  remarks: string | null;
  created_at: string;
  approver_name: string;
}

interface LeaveHistoryItem {
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
  current_approver: string | null;
  monetize_credits: boolean;
  commutation_requested: boolean;
  created_at: string;
  trail: ApprovalStep[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ROLE_LABELS: Record<string, string> = {
  hr: 'HR',
  ovcaa: 'OVCAA',
  ovcaf: 'OVCAF',
};

export default function AllRequestsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalRequests: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [history, setHistory] = useState<LeaveHistoryItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = getHeaders();

      const [summaryRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/reports/summary`, { headers }),
        fetch(`${API_BASE_URL}/leave/history`, { headers }),
      ]);

      const summaryData = await summaryRes.json();
      if (summaryData.success) setSummary(summaryData.summary);

      const historyData = await historyRes.json();
      if (historyData.success) setHistory(historyData.applications);
    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const STATUS_STYLES = {
    approved: 'bg-green-50 text-green-700 border border-green-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    rejected: 'bg-red-50 text-red-600 border border-red-200',
    neutral: 'bg-gray-50 text-gray-600 border border-gray-200',
  };

  const getStatusInfo = (item: LeaveHistoryItem) => {
    const status = item.status;
    if (status === 'approved') {
      return { label: 'Approved', cls: STATUS_STYLES.approved };
    }
    if (status === 'hr_rejected') {
      return { label: 'Rejected by HR', cls: STATUS_STYLES.rejected };
    }
    if (status === 'ovcaa_rejected') {
      return { label: 'Rejected by OVCAA', cls: STATUS_STYLES.rejected };
    }
    if (status === 'rejected' || status === 'ovcaf_rejected') {
      return { label: 'Rejected by OVCAF', cls: STATUS_STYLES.rejected };
    }
    if (status === 'pending' && item.current_approver === 'hr') {
      return { label: 'At HR', cls: STATUS_STYLES.pending };
    }
    if (status === 'hr_approved' && item.current_approver === 'ovcaa') {
      return { label: 'At OVCAA', cls: STATUS_STYLES.pending };
    }
    if (status === 'ovcaa_approved' && item.current_approver === 'ovcaf') {
      return { label: 'At OVCAF', cls: STATUS_STYLES.pending };
    }
    return { label: status, cls: STATUS_STYLES.neutral };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="All Requests"
        description="View all leave applications and their approval trail"
      />

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {/* "Avg. Processing" card removed — its calculation always rounded
              down to 0.0 for quickly-processed test data, which was confusing
              rather than informative. */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <StatCard
              title="Total Requests"
              value={summary.totalRequests}
              description="leave requests"
              icon={FileText}
              variant="primary"
            />
            <StatCard
              title="Approved"
              value={summary.approved}
              description="leave requests"
              icon={TrendingUp}
              variant="primary"
            />
            <StatCard
              title="Pending"
              value={summary.pending}
              description="awaiting approval"
              icon={Calendar}
              variant="primary"
            />
          </div>

          {/* Requests Table */}
          <Card>
            <CardContent className="p-0">
              {history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="w-10 p-3"></th>
                        <th className="text-left p-3">Reference No.</th>
                        <th className="text-left p-3">Employee</th>
                        <th className="text-left p-3">Leave Type</th>
                        <th className="text-center p-3">Dates</th>
                        <th className="text-center p-3">Days</th>
                        <th className="text-center p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => {
                        const isExpanded = expandedIds.has(item.id);
                        const statusInfo = getStatusInfo(item);
                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              className="border-b hover:bg-muted/30 cursor-pointer"
                              onClick={() => toggleExpanded(item.id)}
                            >
                              <td className="p-3 text-center">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground inline" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                                )}
                              </td>
                              <td className="p-3 font-medium">{item.application_number}</td>
                              <td className="p-3">
                                <p className="font-medium">{item.employee_name}</p>
                                <p className="text-xs text-muted-foreground">{item.department}</p>
                              </td>
                              <td className="p-3">{item.leave_type}</td>
                              <td className="text-center p-3">
                                {formatDate(item.start_date)} – {formatDate(item.end_date)}
                              </td>
                              <td className="text-center p-3">{item.days_count}</td>
                              <td className="text-center p-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.cls}`}>
                                  {statusInfo.label}
                                </span>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b bg-muted/20">
                                <td colSpan={7} className="p-4 pl-12">
                                  {item.trail.length > 0 ? (
                                    <div className="space-y-2">
                                      {item.trail.map((step, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm">
                                          {step.action === 'approved' ? (
                                            <Check className="h-4 w-4 text-success shrink-0" />
                                          ) : (
                                            <X className="h-4 w-4 text-destructive shrink-0" />
                                          )}
                                          <span className="w-16 text-muted-foreground font-medium">
                                            {ROLE_LABELS[step.approver_role] || step.approver_role}
                                          </span>
                                          <span>
                                            {step.action === 'approved' ? 'Approved' : 'Rejected'} by {step.approver_name}
                                            {step.remarks ? ` — ${step.remarks}` : ''}
                                          </span>
                                          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDateTime(step.created_at)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No approval action recorded yet — awaiting {ROLE_LABELS[item.current_approver || ''] || 'review'}.
                                    </p>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No leave requests yet
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}