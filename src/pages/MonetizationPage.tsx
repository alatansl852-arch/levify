/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface LeaveApplication {
  id: number;
  employee_id: string;
  employee_name: string;
  email: string;
  department: string;
  position: string;
  application_number: string;
  leave_type: string;
  leave_location: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  monetize_credits: boolean;
  commutation_requested: boolean;
  status: string;
  current_approver: string;
  attachment_count: number;
  created_at: string;
  salary_grade?: number;
}

// Philippine Government Salary Grade Monthly Rates (SSL V / 2024)
const SALARY_GRADE_TABLE: Record<number, number> = {
  1:  13000,  2:  13519,  3:  14060,  4:  14623,  5:  15211,
  6:  15823,  7:  16461,  8:  17126,  9:  17819,  10: 18549,
  11: 19316,  12: 20124,  13: 20972,  14: 21863,  15: 22799,
  16: 23781,  17: 24812,  18: 25895,  19: 27000,  20: 28000,
  21: 29165,  22: 30531,  23: 33584,  24: 36942,  25: 40637,
  26: 44700,  27: 49171,  28: 54083,  29: 59492,  30: 65441,
  31: 72000,  32: 79200,  33: 87120,
};

const computeCashValue = (salaryGrade: number, days: number): number => {
  const monthlySalary = SALARY_GRADE_TABLE[salaryGrade] || 0;
  const dailyRate = monthlySalary / 22; // 22 working days per month
  return dailyRate * days;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function MonetizationPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewRequest, setViewRequest] = useState<LeaveApplication | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (user?.role) {
      fetchMonetizationRequests();
    }
  }, [user?.role]);

  const fetchMonetizationRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('levify_token');
      const response = await fetch(`${API_BASE_URL}/leave/monetization/${user?.role}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching monetization requests:', error);
      toast.error('Failed to load monetization requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessApplication = async (applicationId: number, action: 'approved' | 'rejected') => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('levify_token');
      const response = await fetch(`${API_BASE_URL}/leave/process/${applicationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approver_id: user?.id,
          approver_role: user?.role,
          action,
          remarks
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Monetization request ${action} successfully`);
        setViewRequest(null);
        setRemarks('');
        fetchMonetizationRequests();
      } else {
        toast.error(data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('An error occurred while processing the request');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case 'hr': return 'Monetization Requests - HR Review';
      case 'ovcaa': return 'Monetization Requests - OVCAA Endorsement';
      case 'ovcaf': return 'Monetization Requests - Final Approval';
      default: return 'Monetization Requests';
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={getPageTitle()}
        description="Review and process leave monetization and commutation requests"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Leave Monetization Queue
              </CardTitle>
              <CardDescription>
                {isLoading ? 'Loading requests...' : `${applications.length} monetization request(s) awaiting your action`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading monetization requests...</p>
            </div>
          ) : applications.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App No.</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Est. Cash Value</TableHead>
                    <TableHead>Monetization Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const sg = app.salary_grade || 0;
                    const cashValue = computeCashValue(sg, app.days_count);
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-sm">{app.application_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.employee_name}</p>
                            <p className="text-xs text-muted-foreground">{app.department}</p>
                          </div>
                        </TableCell>
                        <TableCell>{app.leave_type}</TableCell>
                        <TableCell className="font-medium">{app.days_count} days</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {sg > 0 ? formatCurrency(cashValue) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {app.monetize_credits && <Badge variant="default">Monetization</Badge>}
                            {app.commutation_requested && <Badge variant="secondary">Commutation</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={app.status as any} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setViewRequest(app)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-success/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                There are no pending monetization requests requiring your action at this time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!viewRequest} onOpenChange={() => { setViewRequest(null); setRemarks(''); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review Monetization Request
            </DialogTitle>
            <DialogDescription>
              Review leave monetization/commutation request details
            </DialogDescription>
          </DialogHeader>

          {viewRequest && (() => {
            const sg = viewRequest.salary_grade || 0;
            const monthlySalary = SALARY_GRADE_TABLE[sg] || 0;
            const dailyRate = monthlySalary / 22;
            const cashValue = dailyRate * viewRequest.days_count;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Application No.</Label>
                    <p className="font-medium">{viewRequest.application_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1"><StatusBadge status={viewRequest.status as any} /></div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Employee Name</Label>
                    <p className="font-medium">{viewRequest.employee_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="font-medium">{viewRequest.department}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Position</Label>
                    <p className="font-medium">{viewRequest.position}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Leave Type</Label>
                    <p className="font-medium">{viewRequest.leave_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Number of Days</Label>
                    <p className="font-medium text-lg">{viewRequest.days_count} day(s)</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Request Type</Label>
                    <div className="flex gap-1 mt-1">
                      {viewRequest.monetize_credits && <Badge variant="default">Monetization</Badge>}
                      {viewRequest.commutation_requested && <Badge variant="secondary">Commutation</Badge>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Filed On</Label>
                    <p className="font-medium">{formatDate(viewRequest.created_at)}</p>
                  </div>
                </div>

                {/* Auto-computed Cash Value */}
                <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-full">
                      <p className="font-medium text-green-900 dark:text-green-100 mb-3">
                        Monetization Computation (CSC Formula)
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-green-700 dark:text-green-300">Salary Grade</p>
                          <p className="font-bold text-green-900 dark:text-green-100">SG - {sg}</p>
                        </div>
                        <div>
                          <p className="text-green-700 dark:text-green-300">Monthly Salary</p>
                          <p className="font-bold text-green-900 dark:text-green-100">{formatCurrency(monthlySalary)}</p>
                        </div>
                        <div>
                          <p className="text-green-700 dark:text-green-300">Daily Rate (÷ 22 days)</p>
                          <p className="font-bold text-green-900 dark:text-green-100">{formatCurrency(dailyRate)}</p>
                        </div>
                        <div>
                          <p className="text-green-700 dark:text-green-300">Days to Monetize</p>
                          <p className="font-bold text-green-900 dark:text-green-100">{viewRequest.days_count} days</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Estimated Cash Value
                          </p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {sg > 0 ? formatCurrency(cashValue) : 'N/A — No Salary Grade'}
                          </p>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Formula: Monthly Salary ÷ 22 × {viewRequest.days_count} days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                        Monetization Request Summary
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        This employee is requesting to convert {viewRequest.days_count} days of {viewRequest.leave_type}
                        {viewRequest.monetize_credits && ' for cash payment'}
                        {viewRequest.monetize_credits && viewRequest.commutation_requested && ' and '}
                        {viewRequest.commutation_requested && ' with commutation'}.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Reason/Justification</Label>
                  <div className="rounded-lg bg-muted/50 p-3 mt-1">
                    <p className="text-sm">{viewRequest.reason}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Your Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Add your comments or remarks regarding this monetization request..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setViewRequest(null); setRemarks(''); }} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => viewRequest && handleProcessApplication(viewRequest.id, 'rejected')}
              disabled={isProcessing}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              onClick={() => viewRequest && handleProcessApplication(viewRequest.id, 'approved')}
              disabled={isProcessing}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}