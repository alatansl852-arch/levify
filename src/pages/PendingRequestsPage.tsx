/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge, type LeaveStatus } from '@/components/ui/status-badge';
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
import { Clock, CheckCircle, XCircle, Eye, FileText, Paperclip, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import heic2any from 'heic2any';

interface Attachment {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
}

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
  status: LeaveStatus;
  current_approver: string;
  attachment_count: number;
  created_at: string;
  // Monetization-specific fields (present only on monetization requests)
  monetize_credits?: boolean;
  commutation_requested?: boolean;
  salary_grade?: number;
}

type RequestKind = 'regular' | 'monetization';

interface CombinedApplication extends LeaveApplication {
  kind: RequestKind;
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
const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

type FilterTab = 'all' | 'regular' | 'monetization';

function AttachmentPreview({
  fileUrl,
  fileType,
  fileName,
}: {
  fileUrl: string;
  fileType: string;
  fileName: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const isHeic =
    fileType?.toLowerCase().includes('heic') ||
    fileType?.toLowerCase().includes('heif') ||
    fileName?.toLowerCase().endsWith('.heic') ||
    fileName?.toLowerCase().endsWith('.heif');

  const isPlainImage = !isHeic && fileType?.startsWith('image/');

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    if (isHeic) {
      setStatus('loading');
      fetch(fileUrl)
        .then((res) => res.blob())
        .then((blob) => heic2any({ blob, toType: 'image/jpeg', quality: 0.8 }))
        .then((converted) => {
          if (cancelled) return;
          const convertedBlob = Array.isArray(converted) ? converted[0] : converted;
          objectUrl = URL.createObjectURL(convertedBlob as Blob);
          setPreviewUrl(objectUrl);
          setStatus('ready');
        })
        .catch((err) => {
          console.error('HEIC conversion failed:', err);
          if (!cancelled) setStatus('error');
        });
    } else if (isPlainImage) {
      setPreviewUrl(fileUrl);
      setStatus('ready');
    } else {
      setStatus('error'); // not an image type at all — use file icon fallback
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, isHeic, isPlainImage]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-muted/50">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">Converting preview...</p>
      </div>
    );
  }

  if (status === 'ready' && previewUrl) {
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={previewUrl}
          alt={fileName}
          className="w-full h-40 object-cover hover:opacity-90 transition-opacity cursor-pointer"
        />
      </a>
    );
  }

  // error / non-image fallback
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center h-40 bg-muted/50 hover:bg-muted transition-colors"
    >
      <div className="text-center">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">Click to view</p>
      </div>
    </a>
  );
}

export default function PendingRequestsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [regularApps, setRegularApps] = useState<LeaveApplication[]>([]);
  const [monetizationApps, setMonetizationApps] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const [viewRequest, setViewRequest] = useState<CombinedApplication | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remarks, setRemarks] = useState('');
  // ✅ Holds the application that OVCAF just approved, so we can show a
  // "Ready to Print" confirmation instead of just closing the dialog.
  const [printReadyApp, setPrintReadyApp] = useState<CombinedApplication | null>(null);

  useEffect(() => {
    if (user?.role) {
      fetchAllApplications();
    }
  }, [user?.role]);

  useEffect(() => {
    const combined = [...regularApps.map(a => ({ ...a, kind: 'regular' as RequestKind })),
                       ...monetizationApps.map(a => ({ ...a, kind: 'monetization' as RequestKind }))];
    if (combined.length === 0) return;

    const state = location.state as { applicationId?: number; applicationNumber?: string } | null;

    if (state?.applicationId) {
      const app = combined.find(a => a.id === state.applicationId);
      if (app) {
        handleReviewClick(app);
        window.history.replaceState({}, '');
      }
    } else if (state?.applicationNumber) {
      const app = combined.find(a => a.application_number === state.applicationNumber);
      if (app) {
        handleReviewClick(app);
        window.history.replaceState({}, '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regularApps, monetizationApps, location.state]);

  const getHeaders = () => {
    const token = localStorage.getItem('levify_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchAllApplications = async () => {
    try {
      setIsLoading(true);
      const [regularRes, monetizationRes] = await Promise.all([
        fetch(`${API_BASE_URL}/leave/pending/${user?.role}`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/leave/monetization/${user?.role}`, { headers: getHeaders() }),
      ]);

      const regularData = await regularRes.json();
      const monetizationData = await monetizationRes.json();

      if (regularData.success) {
        setRegularApps(regularData.applications);
      }
      if (monetizationData.success) {
        setMonetizationApps(monetizationData.applications);
      }
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttachments = async (applicationId: number) => {
    try {
      setLoadingAttachments(true);
      const response = await fetch(`${API_BASE_URL}/leave/details/${applicationId}`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setAttachments(data.attachments || []);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleReviewClick = (app: CombinedApplication) => {
    setViewRequest(app);
    setAttachments([]);
    fetchAttachments(app.id);
  };

  const handleProcessApplication = async (applicationId: number, action: 'approved' | 'rejected') => {
    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE_URL}/leave/process/${applicationId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          approver_id: Number(user?.id),
          approver_role: user?.role,
          action,
          remarks,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Application ${action} successfully`);

        // ✅ If OVCAF just fully approved a request, this was the final step —
        // show a Ready to Print confirmation instead of just closing the dialog.
        if (user?.role === 'ovcaf' && action === 'approved' && viewRequest) {
          setPrintReadyApp(viewRequest);
          setViewRequest(null);
          setRemarks('');
          setAttachments([]);
        } else {
          closeDialog();
        }

        fetchAllApplications();
      } else {
        toast.error(data.message || 'Failed to process application');
      }
    } catch (error) {
      console.error('Error processing application:', error);
      toast.error('An error occurred while processing the application');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeDialog = () => {
    setViewRequest(null);
    setRemarks('');
    setAttachments([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileUrl = (filePath: string) => {
    const normalized = filePath.replace(/\\/g, '/');
    return `${FILE_BASE_URL}/${normalized.replace(/^\//, '')}`;
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case 'hr': return 'For HR Review';
      case 'ovcaa': return 'For OVCAA Endorsement';
      case 'ovcaf': return 'For Final Approval';
      default: return 'Pending Leave Requests';
    }
  };

  const combinedApplications: CombinedApplication[] = useMemo(() => {
    const regular = regularApps.map(a => ({ ...a, kind: 'regular' as RequestKind }));
    const monetization = monetizationApps.map(a => ({ ...a, kind: 'monetization' as RequestKind }));
    return [...regular, ...monetization].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [regularApps, monetizationApps]);

  const filteredApplications = useMemo(() => {
    if (activeTab === 'regular') return combinedApplications.filter(a => a.kind === 'regular');
    if (activeTab === 'monetization') return combinedApplications.filter(a => a.kind === 'monetization');
    return combinedApplications;
  }, [combinedApplications, activeTab]);

  const tabCounts = {
    all: combinedApplications.length,
    regular: regularApps.length,
    monetization: monetizationApps.length,
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={getPageTitle()}
        description="Review and process leave applications, including monetization and commutation requests"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Leave Requests Queue
              </CardTitle>
              <CardDescription>
                {isLoading ? 'Loading requests...' : `${filteredApplications.length} request(s) awaiting your action`}
              </CardDescription>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mt-4 border-b">
            {([
              { key: 'all', label: 'All' },
              { key: 'regular', label: 'Regular' },
              { key: 'monetization', label: 'Monetization' },
            ] as { key: FilterTab; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-70">({tabCounts[tab.key]})</span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          ) : filteredApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App No.</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates / Days</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={`${app.kind}-${app.id}`} className="table-row-hover">
                      <TableCell className="font-mono text-sm">{app.application_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{app.department}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.leave_type}</TableCell>
                      <TableCell>
                        {app.kind === 'regular' ? (
                          <div className="text-sm">
                            <p>{formatDate(app.start_date)}</p>
                            <p className="text-muted-foreground">to {formatDate(app.end_date)}</p>
                          </div>
                        ) : (
                          <p className="text-sm font-medium">{app.days_count} days</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.kind === 'monetization' ? (
                          <div className="flex gap-1 flex-wrap">
                            {app.monetize_credits && <Badge variant="default">Monetization</Badge>}
                            {app.commutation_requested && <Badge variant="secondary">Commutation</Badge>}
                          </div>
                        ) : (
                          <Badge variant="outline">Regular</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.attachment_count > 0 ? (
                          <span className="flex items-center gap-1 text-sm text-blue-600">
                            <Paperclip className="h-3 w-3" />
                            {app.attachment_count}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReviewClick(app)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-success/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                There are no pending requests requiring your action at this time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewRequest} onOpenChange={closeDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Review {viewRequest?.kind === 'monetization' ? 'Monetization' : 'Leave'} Application
            </DialogTitle>
            <DialogDescription>
              Carefully review the details before approving or rejecting
            </DialogDescription>
          </DialogHeader>

          {viewRequest && (() => {
            const isMonetization = viewRequest.kind === 'monetization';
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
                    <div className="mt-1">
                      <StatusBadge status={viewRequest.status} />
                    </div>
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

                  {isMonetization ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Inclusive Dates</Label>
                        <p className="font-medium">
                          {formatDate(viewRequest.start_date)} - {formatDate(viewRequest.end_date)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Number of Days</Label>
                        <p className="font-medium">{viewRequest.days_count} day(s)</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Location</Label>
                        <p className="font-medium">{viewRequest.leave_location || 'N/A'}</p>
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-muted-foreground">Filed On</Label>
                    <p className="font-medium">{formatDate(viewRequest.created_at)}</p>
                  </div>
                </div>

                {/* Monetization-only: cash value computation */}
                {isMonetization && (
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
                            <p className={sg > 0 ? 'text-2xl font-bold text-green-700 dark:text-green-300' : 'text-sm font-semibold text-green-700 dark:text-green-300'}>
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
                )}

                {isMonetization && (
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
                )}

                <div>
                  <Label className="text-muted-foreground">Reason</Label>
                  <div className="rounded-lg bg-muted/50 p-3 mt-1">
                    <p className="text-sm">{viewRequest.reason}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({attachments.length})
                  </Label>
                  {loadingAttachments ? (
                    <div className="rounded-lg bg-muted/50 p-3 mt-1 text-sm text-muted-foreground">
                      Loading attachments...
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="rounded-lg bg-muted/50 p-3 mt-1 text-sm text-muted-foreground">
                      No attachments submitted
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="border rounded-lg overflow-hidden bg-muted/20">
                          <AttachmentPreview
                            fileUrl={getFileUrl(attachment.file_path)}
                            fileType={attachment.file_type}
                            fileName={attachment.file_name}
                          />
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Your Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Add your comments or remarks here..."
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
            <Button variant="outline" onClick={closeDialog} disabled={isProcessing}>
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

      {/* Ready to Print — shown only after OVCAF gives final approval */}
      <Dialog open={!!printReadyApp} onOpenChange={() => setPrintReadyApp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Fully Approved
            </DialogTitle>
            <DialogDescription>
              {printReadyApp?.application_number} has been fully approved. The CSC leave form
              (Section 7) is ready to print for signature.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setPrintReadyApp(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (printReadyApp) {
                  window.open(`/print-leave/${printReadyApp.id}`, '_blank');
                }
                setPrintReadyApp(null);
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              Open Printable Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}