/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getLeaveTypeLabel, formatDate, formatDateTime } from '@/lib/leave-utils';
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
import { FileText, Eye, Download, Loader2 } from 'lucide-react';
import heic2any from 'heic2any';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

const getFileUrl = (filePath: string) => {
  const normalized = (filePath || '').replace(/\\/g, '/');
  return `${FILE_BASE_URL}/${normalized.replace(/^\//, '')}`;
};

/**
 * Thumbnail for an attachment. Images (including HEIC, converted to JPEG)
 * show as a picture; clicking opens the in-page viewer via onOpenImage.
 * Non-image files (PDF, Word, ...) show a file icon that opens in a new tab.
 */
function AttachmentPreview({
  fileUrl,
  fileType,
  fileName,
  onOpenImage,
}: {
  fileUrl: string;
  fileType: string;
  fileName: string;
  onOpenImage: (url: string, name: string) => void;
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
      setStatus('error'); // not an image — use file icon fallback
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
        <p className="text-xs text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  if (status === 'ready' && previewUrl) {
    return (
      <button
        type="button"
        onClick={() => onOpenImage(previewUrl, fileName)}
        className="block w-full"
      >
        <img
          src={previewUrl}
          alt={fileName}
          className="w-full h-40 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
        />
      </button>
    );
  }

  // error / non-image fallback (e.g. PDF) — opens in a new tab
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

export default function LeaveHistoryPage() {
  const { user } = useAuth();
  const { getEmployeeLeaveHistory, leaveRequests } = useLeave();
  const [viewRequest, setViewRequest] = useState<number | null>(null);
  // ✅ In-page image viewer for attachments (no new tab).
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

  // FIXED: Use employeeId instead of id
  const history = user ? getEmployeeLeaveHistory(user.employeeId) : [];
  const viewRequestData = leaveRequests.find((r) => r.id === viewRequest);

  const closeDetails = () => {
    setViewRequest(null);
    setLightbox(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const downloadFile = (file: any) => {
    window.open(getFileUrl(file.url), '_blank');
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Leave History"
        description="View all your leave applications and their status"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Leave Application Records
          </CardTitle>
          <CardDescription>
            Complete history of your leave requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference No.</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((request) => (
                    <TableRow key={request.id} className="table-row-hover">
                      <TableCell className="font-medium">{request.reference_no || request.id}</TableCell>
                      <TableCell>{getLeaveTypeLabel(request.leaveType)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(request.startDate)}</p>
                          <p className="text-muted-foreground">to {formatDate(request.endDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{request.numberOfDays}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(request.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setViewRequest(request.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Leave History</h3>
              <p className="text-muted-foreground mb-4">
                You haven't filed any leave applications yet.
              </p>
              <Button asChild>
                <Link to="/apply-leave">Apply for Leave</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!viewRequest} onOpenChange={closeDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Leave Request Details
            </DialogTitle>
            <DialogDescription>
              Complete information about your leave application
            </DialogDescription>
          </DialogHeader>
          {viewRequestData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reference No.</p>
                  <p className="font-medium">{viewRequestData.reference_no || `#${viewRequestData.id}`}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={viewRequestData.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee Name</p>
                  <p className="font-medium">{viewRequestData.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{viewRequestData.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{viewRequestData.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leave Type</p>
                  <p className="font-medium">{getLeaveTypeLabel(viewRequestData.leaveType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inclusive Dates</p>
                  <p className="font-medium">
                    {formatDate(viewRequestData.startDate)} - {formatDate(viewRequestData.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number of Days</p>
                  <p className="font-medium">{viewRequestData.numberOfDays} day(s)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Filed On</p>
                  <p className="font-medium">{formatDateTime(viewRequestData.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDateTime(viewRequestData.updatedAt)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm">{viewRequestData.reason}</p>
                </div>
              </div>
              
              {/* Attachments Section */}
              {viewRequestData.attachments && viewRequestData.attachments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Supporting Documents</p>
                    <span className="text-xs text-muted-foreground">
                      {viewRequestData.attachments.length} file(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/30">
                    {viewRequestData.attachments.map((file: any) => (
                      <div key={file.id} className="border rounded-lg overflow-hidden bg-background">
                        <AttachmentPreview
                          fileUrl={getFileUrl(file.url)}
                          fileType={file.type}
                          fileName={file.name}
                          onOpenImage={(url, name) => setLightbox({ url, name })}
                        />
                        <div className="flex items-center gap-2 p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remarks Section */}
              {viewRequestData.hrRemarks && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-sm font-medium mb-1 text-blue-800 dark:text-blue-200">HR Remarks:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{viewRequestData.hrRemarks}</p>
                </div>
              )}
              {viewRequestData.ovcaaRemarks && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-sm font-medium mb-1 text-blue-800 dark:text-blue-200">OVCAA Remarks:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{viewRequestData.ovcaaRemarks}</p>
                </div>
              )}
              {viewRequestData.ovcafRemarks && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-sm font-medium mb-1 text-blue-800 dark:text-blue-200">OVCAF Remarks:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{viewRequestData.ovcafRemarks}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {viewRequestData.status.includes('rejected') && viewRequestData.rejectionReason && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm font-medium mb-1 text-red-800 dark:text-red-200">Rejection Reason:</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{viewRequestData.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDetails}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Full-screen in-page image viewer — opens on top of the details dialog */}
      <Dialog open={!!lightbox} onOpenChange={(open) => { if (!open) setLightbox(null); }}>
        <DialogContent className="max-w-none sm:max-w-none w-[96vw] h-[94vh] p-3 sm:p-4 flex flex-col gap-2">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-sm font-medium truncate pr-6">
              {lightbox?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full-size preview of the attachment
            </DialogDescription>
          </DialogHeader>
          {lightbox && (
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-md overflow-hidden">
              <img
                src={lightbox.url}
                alt={lightbox.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}