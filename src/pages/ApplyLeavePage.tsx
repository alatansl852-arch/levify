import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave, LeaveType } from '@/contexts/LeaveContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { leaveTypeLabels, leaveTypeDescriptions, calculateWorkingDays } from '@/lib/leave-utils';
import { FileText, Calendar, AlertCircle, X } from 'lucide-react';

const leaveCategories = {
  regular: ['vacation', 'sick', 'special_privilege', 'forced'] as LeaveType[],
  special: ['maternity', 'paternity', 'solo_parent', 'study', 'vawc', 'rehabilitation', 'special_emergency', 'adoption', 'calamity'] as LeaveType[],
  other: ['terminal', 'other'] as LeaveType[],
};

export default function ApplyLeavePage() {
  const { user } = useAuth();
  const { addLeaveRequest, getEmployeeLeaveBalance } = useLeave();
  const navigate = useNavigate();
  
  const [leaveType, setLeaveType] = useState<LeaveType>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState<'within_ph' | 'abroad'>('within_ph');
  const [hospitalDetails, setHospitalDetails] = useState('');
  const [commutation, setCommutation] = useState<'requested' | 'not_requested'>('not_requested');
  const [monetizationRequested, setMonetizationRequested] = useState(false);
  const [monetizationDays, setMonetizationDays] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [otherLeaveType, setOtherLeaveType] = useState('');

  // FIXED: Use employeeId instead of id — balances are keyed by employeeId
  const balance = user ? getEmployeeLeaveBalance(user.employeeId) : undefined;
  const numberOfDays = startDate && endDate ? calculateWorkingDays(startDate, endDate) : 0;
  const isWeekendOnlyRange = !!startDate && !!endDate && numberOfDays === 0;

  // Calculate monetization amount (example: based on daily rate)
  const dailyRate = 500; // This should come from user's actual salary data
  const calculateMonetizationAmount = () => {
    if (!monetizationRequested || !monetizationDays) return 0;
    return parseInt(monetizationDays) * dailyRate;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (uploadedFiles.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    const validFiles: File[] = [];
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Max size is 5MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) uploaded successfully`);
    }

    // Reset input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('File removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }

    if (numberOfDays === 0) {
      toast.error('Selected dates contain no working days', {
        description: 'Please choose a date range that includes at least one weekday.',
      });
      return;
    }

    if (monetizationRequested && !monetizationDays) {
      toast.error('Please enter number of days to monetize');
      return;
    }

    if (leaveType === 'other' && !otherLeaveType.trim()) {
      toast.error('Please specify the leave type');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get API base URL from environment variable
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      // Get auth token
      const token = localStorage.getItem('levify_token');
      
      // Create FormData to send files
      const formData = new FormData();
      
      // Add all form fields
      formData.append('employee_id', user.employeeId);
      formData.append('leave_type', leaveType === 'other' ? otherLeaveType : leaveTypeLabels[leaveType]);
      formData.append('leave_location', location);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      formData.append('days_count', numberOfDays.toString());
      formData.append('reason', reason);
      formData.append('monetize_credits', monetizationRequested ? '1' : '0');
      formData.append('commutation_requested', commutation === 'requested' ? '1' : '0');
      
      // Add hospital details if sick leave
      if (leaveType === 'sick' && hospitalDetails) {
        formData.append('hospital_details', hospitalDetails);
      }
      
      // Add files to FormData
      uploadedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      // Make API call to backend
      const response = await fetch(`${API_BASE_URL}/leave/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Leave application submitted successfully!', {
          description: `Application ${data.application_number} has been forwarded to HR for processing.`,
        });
        navigate('/leave-history');
      } else {
        toast.error('Failed to submit application', {
          description: data.message,
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit leave application', {
        description: 'Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Apply for Leave"
        description="Submit your leave application following CSC guidelines"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Leave Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Type of Leave
                </CardTitle>
                <CardDescription>
                  Select the type of leave as prescribed by CSC Omnibus Rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Regular Leave Types</Label>
                  <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    {/* ✅ FIX: swapped the manual <div> category headers for the
                        SelectLabel component so they pick up the sticky, styled
                        treatment defined in select.tsx (instead of plain unstyled
                        text mixed in with the selectable rows). */}
                    <SelectContent>
                      <SelectLabel>Regular Leave</SelectLabel>
                      {leaveCategories.regular.map((type) => (
                        <SelectItem key={type} value={type}>
                          {leaveTypeLabels[type]}
                        </SelectItem>
                      ))}
                      <SelectLabel className="mt-1">Special Leave</SelectLabel>
                      {leaveCategories.special.map((type) => (
                        <SelectItem key={type} value={type}>
                          {leaveTypeLabels[type]}
                        </SelectItem>
                      ))}
                      <SelectLabel className="mt-1">Other</SelectLabel>
                      {leaveCategories.other.map((type) => (
                        <SelectItem key={type} value={type}>
                          {leaveTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {leaveTypeDescriptions[leaveType]}
                  </p>
                </div>

                {/* Other Leave Type Specification */}
                {leaveType === 'other' && (
                  <div className="space-y-3 rounded-lg border p-4 bg-blue-50 dark:bg-blue-950">
                    <Label htmlFor="other_leave_type">Please Specify Leave Type *</Label>
                    <Input
                      id="other_leave_type"
                      placeholder="Enter the specific type of leave"
                      value={otherLeaveType}
                      onChange={(e) => setOtherLeaveType(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Please provide details about the type of leave you are applying for.
                    </p>
                  </div>
                )}

                {/* Vacation/Sick Leave Details */}
                {leaveType === 'vacation' && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Label>Details of Leave (Vacation/Special Privilege Leave)</Label>
                    <RadioGroup value={location} onValueChange={(v) => setLocation(v as 'within_ph' | 'abroad')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="within_ph" id="within_ph" />
                        <Label htmlFor="within_ph" className="font-normal">Within the Philippines</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="abroad" id="abroad" />
                        <Label htmlFor="abroad" className="font-normal">Abroad (Specify)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {leaveType === 'sick' && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Label>Details of Leave (Sick Leave)</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="in_hospital" />
                        <Label htmlFor="in_hospital" className="font-normal">In Hospital (Specify Illness)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="out_patient" />
                        <Label htmlFor="out_patient" className="font-normal">Out Patient (Specify Illness)</Label>
                      </div>
                    </div>
                    <Input
                      placeholder="Specify hospital/clinic and illness"
                      value={hospitalDetails}
                      onChange={(e) => setHospitalDetails(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Inclusive Dates
                </CardTitle>
                <CardDescription>
                  Select the start and end dates of your leave
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {startDate && endDate && (
                  <p className="mt-3 text-sm font-medium">
                    Number of Working Days: <span className="text-primary">{numberOfDays}</span>
                    {isWeekendOnlyRange && (
                      <span className="ml-2 text-xs font-normal text-destructive">
                        (selected dates fall on a weekend — no working days in this range)
                      </span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Reason */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reason for Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Provide a detailed reason for your leave application..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </CardContent>
            </Card>

            {/* Monetization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Monetization of Leave Credits
                </CardTitle>
                <CardDescription>
                  Convert your unused vacation leave credits to cash (Optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="monetization_checkbox" 
                    checked={monetizationRequested}
                    onCheckedChange={(checked) => {
                      setMonetizationRequested(checked as boolean);
                      if (!checked) setMonetizationDays('');
                    }}
                  />
                  <Label htmlFor="monetization_checkbox" className="font-normal">
                    I want to monetize my leave credits
                  </Label>
                </div>

                {monetizationRequested && (
                  <div className="space-y-3 rounded-lg border p-4 bg-secondary/10 mt-3">
                    <p className="text-sm text-muted-foreground">
                      Monetization of leave credits is subject to availability of funds and approval by the agency head.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="monetization_days">Number of Days to Monetize</Label>
                      <Input
                        id="monetization_days"
                        type="number"
                        min="1"
                        max={balance?.vacationLeave || 15}
                        placeholder="Enter number of days"
                        value={monetizationDays}
                        onChange={(e) => setMonetizationDays(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum monetizable: {balance?.vacationLeave?.toFixed(2) || 0} vacation leave days
                      </p>
                      {monetizationDays && (
                        <div className="mt-3 p-4 bg-primary/10 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Daily Rate:</span>
                            <span className="text-sm font-medium">₱{dailyRate.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Days:</span>
                            <span className="text-sm font-medium">{monetizationDays}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between items-center">
                            <span className="text-sm font-semibold">Estimated Amount:</span>
                            <span className="text-lg font-bold text-primary">
                              ₱{calculateMonetizationAmount().toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Calculation: {monetizationDays} days × ₱{dailyRate.toLocaleString()} = ₱{calculateMonetizationAmount().toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            *Subject to final computation and fund availability
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachment</CardTitle>
                <CardDescription>
                  Upload supporting documents (Optional) - Max 5 files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadedFiles.length < 5 && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      id="file-upload"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Click to upload files</p>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, PNG, DOC (Max 5MB each) - {uploadedFiles.length}/5 files
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="text-sm flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Application Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Leave Type:</span>
                    <span className="font-medium">
                      {leaveType === 'other' && otherLeaveType 
                        ? otherLeaveType 
                        : leaveTypeLabels[leaveType]}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">
                      {numberOfDays} day(s)
                      {isWeekendOnlyRange && (
                        <span className="ml-1 text-xs text-destructive">(weekend only)</span>
                      )}
                    </span>
                  </div>
                  {startDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">From:</span>
                      <span className="font-medium">{startDate}</span>
                    </div>
                  )}
                  {endDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">To:</span>
                      <span className="font-medium">{endDate}</span>
                    </div>
                  )}
                  
                  {monetizationRequested && monetizationDays && (
                    <>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-muted-foreground">Monetization:</span>
                        <span className="font-medium">{monetizationDays} day(s)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Amount:</span>
                        <span className="font-medium text-primary">
                          ₱{calculateMonetizationAmount().toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attachments:</span>
                      <span className="font-medium">{uploadedFiles.length} file(s)</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Your Leave Balance:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vacation Leave:</span>
                      <span>{balance?.vacationLeave?.toFixed(2) || '0.00'} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sick Leave:</span>
                      <span>{balance?.sickLeave?.toFixed(2) || '0.00'} days</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    Your application will be reviewed by HR, then forwarded to OVCAA/OVCAF for approval.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}