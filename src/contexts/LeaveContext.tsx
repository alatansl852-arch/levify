// src/contexts/LeaveContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type LeaveType = 
  | 'vacation'
  | 'sick'
  | 'maternity'
  | 'paternity'
  | 'special_privilege'
  | 'solo_parent'
  | 'study'
  | 'vawc'
  | 'rehabilitation'
  | 'special_emergency'
  | 'adoption'
  | 'calamity'
  | 'monetization'
  | 'terminal'
  | 'forced'
  | 'other';

export type LeaveStatus = 'pending' | 'hr_approved' | 'ovcaa_approved' | 'approved' | 'rejected' | 'hr_rejected' | 'ovcaa_rejected';

export interface LeaveAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface ApprovalTrailEntry {
  leave_application_id: number;
  approver_role: string;
  action: string;
  remarks?: string;
  created_at: string;
  approver_name: string;
}

export interface LeaveRequest {
  id: number;
  reference_no: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  leaveType: LeaveType;
  otherLeaveType?: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt?: string;
  hrRemarks?: string;
  ovcaaRemarks?: string;
  ovcafRemarks?: string;
  rejectionReason?: string;
  isMonetization?: boolean;
  monetizationDays?: number;
  location?: 'within_ph' | 'abroad';
  hospitalDetails?: string;
  commutation?: 'requested' | 'not_requested';
  attachments?: LeaveAttachment[];
  trail?: ApprovalTrailEntry[];
}

export interface LeaveBalance {
  id: number;
  employeeId: string;
  vacationLeave: number;
  sickLeave: number;
  specialPrivilege: number;
  forcedLeave: number;
  totalEarned: number;
  totalUsed: number;
  year: number;
}

// ---- Backend response shapes (replaces `any`) ----

interface BackendAttachment {
  id: number | string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
}

interface BackendLeaveApplication {
  id: number;
  application_number: string;
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: string | number;
  reason: string;
  status: LeaveStatus;
  created_at: string;
  updated_at?: string;
  hr_remarks?: string;
  ovcaa_remarks?: string;
  ovcaf_remarks?: string;
  rejection_reason?: string;
  monetize_credits?: boolean;
  commutation_requested?: boolean;
  leave_location?: string;
  attachment_count?: number;
  trail?: ApprovalTrailEntry[];
}

interface ApplicationDetailsResult {
  application: BackendLeaveApplication;
  attachments: LeaveAttachment[];
  history: ApprovalTrailEntry[];
}

interface LeaveContextType {
  leaveRequests: LeaveRequest[];
  allRequests: LeaveRequest[];
  leaveBalances: Map<string, LeaveBalance>;
  isLoading: boolean;
  isLoadingAll: boolean;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status' | 'reference_no' | 'employeeId' | 'employeeName' | 'department' | 'position'>) => Promise<void>;
  updateLeaveStatus: (id: number, status: LeaveStatus, remarks?: string, remarkType?: 'hr' | 'ovcaa' | 'ovcaf') => Promise<void>;
  getEmployeeLeaveBalance: (employeeId: string) => LeaveBalance | undefined;
  getEmployeeLeaveHistory: (employeeId: string) => LeaveRequest[];
  getPendingRequests: (role: 'hr' | 'ovcaa' | 'ovcaf') => LeaveRequest[];
  refreshRequests: () => Promise<void>;
  refreshAllRequests: () => Promise<void>;
  refreshBalance: (employeeId: string) => Promise<void>;
  getApplicationDetails: (id: number) => Promise<ApplicationDetailsResult | null>;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export function LeaveProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Map<string, LeaveBalance>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const getAuthToken = () => localStorage.getItem('levify_token');

  const mapLeaveType = (backendType: string): LeaveType => {
    const mapping: Record<string, LeaveType> = {
      'Vacation Leave': 'vacation',
      'Sick Leave': 'sick',
      'Maternity Leave': 'maternity',
      'Paternity Leave': 'paternity',
      'Special Privilege Leave': 'special_privilege',
      'Solo Parent Leave': 'solo_parent',
      'Study Leave': 'study',
      'VAWC Leave': 'vawc',
      'Rehabilitation Leave': 'rehabilitation',
      'Special Emergency Leave': 'special_emergency',
      'Adoption Leave': 'adoption',
      'Calamity Leave': 'calamity',
      'Monetization': 'monetization',
      'Terminal Leave': 'terminal',
      'Forced Leave': 'forced'
    };
    return mapping[backendType] || 'other';
  };

  const mapLeaveTypeToBackend = (frontendType: LeaveType): string => {
    const mapping: Record<LeaveType, string> = {
      vacation: 'Vacation Leave',
      sick: 'Sick Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      special_privilege: 'Special Privilege Leave',
      solo_parent: 'Solo Parent Leave',
      study: 'Study Leave',
      vawc: 'VAWC Leave',
      rehabilitation: 'Rehabilitation Leave',
      special_emergency: 'Special Emergency Leave',
      adoption: 'Adoption Leave',
      calamity: 'Calamity Leave',
      monetization: 'Monetization',
      terminal: 'Terminal Leave',
      forced: 'Forced Leave',
      other: 'Other'
    };
    return mapping[frontendType];
  };

  // ✅ FIX: Wrapped in useCallback so it has a stable reference and can be safely
  // listed as a dependency in refreshRequests / refreshAllRequests below.
  const mapApplication = useCallback(async (app: BackendLeaveApplication, token: string | null): Promise<LeaveRequest> => {
    let attachments: LeaveAttachment[] = [];

    if (app.attachment_count && app.attachment_count > 0) {
      try {
        const detailsResponse = await fetch(`${API_BASE_URL}/leave/details/${app.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const detailsData = await detailsResponse.json();

        if (detailsData.success && detailsData.attachments) {
          attachments = detailsData.attachments.map((att: BackendAttachment) => ({
            id: att.id.toString(),
            name: att.file_name,
            size: att.file_size,
            type: att.file_type,
            url: att.file_path
          }));
        }
      } catch (error) {
        console.error('Error fetching attachments for application', app.id, error);
      }
    }

    return {
      id: app.id,
      reference_no: app.application_number,
      employeeId: app.employee_id,
      employeeName: app.employee_name,
      department: app.department,
      position: app.position,
      leaveType: mapLeaveType(app.leave_type),
      startDate: app.start_date,
      endDate: app.end_date,
      numberOfDays: parseFloat(app.days_count as string),
      reason: app.reason,
      status: app.status,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      hrRemarks: app.hr_remarks,
      ovcaaRemarks: app.ovcaa_remarks,
      ovcafRemarks: app.ovcaf_remarks,
      rejectionReason: app.rejection_reason,
      isMonetization: app.monetize_credits,
      commutation: app.commutation_requested ? 'requested' : 'not_requested',
      location: app.leave_location === 'abroad' ? 'abroad' : 'within_ph',
      attachments,
      trail: app.trail || []
    };
  }, []);

  const refreshRequests = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const token = getAuthToken();
      let endpoint = '';

      if (user.role === 'hr') {
        endpoint = `${API_BASE_URL}/leave/pending/hr`;
      } else if (user.role === 'ovcaa') {
        endpoint = `${API_BASE_URL}/leave/pending/ovcaa`;
      } else if (user.role === 'ovcaf') {
        endpoint = `${API_BASE_URL}/leave/pending/ovcaf`;
      } else {
        endpoint = `${API_BASE_URL}/leave/my-applications/${user.employeeId}`;
      }

      console.log('📥 Fetching leave requests from:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📥 Leave requests response:', data);
      
      if (data.success) {
        const mapped = await Promise.all(
          data.applications.map((app: BackendLeaveApplication) => mapApplication(app, token))
        );
        
        console.log('✅ Mapped leave requests:', mapped);
        setLeaveRequests(mapped);
      }
    } catch (error) {
      console.error('❌ Error fetching leave requests:', error);
    } finally {
      setIsLoading(false);
    }
  // ✅ FIX: added mapApplication dependency
  }, [user, mapApplication]);

  // Fetches EVERY leave application (all statuses, all employees) via /leave/history
  // Used by pages like "All Requests" that need the complete list, not just pending ones.
  const refreshAllRequests = useCallback(async () => {
    setIsLoadingAll(true);
    try {
      const token = getAuthToken();
      console.log('📥 Fetching full leave history from /leave/history');

      const response = await fetch(`${API_BASE_URL}/leave/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📥 Full history response:', data);

      if (data.success) {
        const mapped = await Promise.all(
          data.applications.map((app: BackendLeaveApplication) => mapApplication(app, token))
        );

        console.log('✅ Mapped all requests:', mapped);
        setAllRequests(mapped);
      }
    } catch (error) {
      console.error('❌ Error fetching all leave requests:', error);
    } finally {
      setIsLoadingAll(false);
    }
  // ✅ FIX: added mapApplication dependency
  }, [mapApplication]);

  // FIX: Now fetches real data from the database instead of hardcoded values
  const refreshBalance = useCallback(async (employeeId: string) => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      console.log('📥 Fetching real balance from DB for employee:', employeeId);

      const response = await fetch(`${API_BASE_URL}/leave/balance/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📥 Balance response:', data);

      if (data.success) {
        const balance: LeaveBalance = {
          id: Date.now(),
          employeeId,
          vacationLeave: data.balance.vacationLeave,
          sickLeave: data.balance.sickLeave,
          specialPrivilege: data.balance.specialPrivilege,
          forcedLeave: data.balance.forcedLeave,
          totalEarned: data.balance.totalEarned,
          totalUsed: data.balance.totalUsed,
          year: new Date().getFullYear()
        };

        setLeaveBalances(prev => {
          const newMap = new Map(prev);
          newMap.set(employeeId, balance);
          return newMap;
        });

        console.log('✅ Real balance loaded for:', employeeId, balance);
      }
    } catch (error) {
      console.error('❌ Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.employeeId) {
      console.log('👤 User changed, refreshing data for:', user.employeeId);
      refreshRequests();
      refreshBalance(user.employeeId);
    }
  }, [user, refreshRequests, refreshBalance]);

  const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status' | 'reference_no' | 'employeeId' | 'employeeName' | 'department' | 'position'>) => {
    if (!user || !user.employeeId) {
      console.error('❌ Cannot submit leave: No user or employeeId');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = getAuthToken();
      
      const formData = new FormData();
      formData.append('employee_id', user.employeeId);
      formData.append('leave_type', mapLeaveTypeToBackend(request.leaveType));
      formData.append('leave_location', request.location === 'abroad' ? 'abroad' : 'within_philippines');
      formData.append('start_date', request.startDate);
      formData.append('end_date', request.endDate);
      formData.append('days_count', request.numberOfDays.toString());
      formData.append('reason', request.reason);
      formData.append('monetize_credits', request.isMonetization ? 'true' : 'false');
      formData.append('commutation_requested', request.commutation === 'requested' ? 'true' : 'false');

      console.log('📤 Submitting leave request for employee:', user.employeeId);

      const response = await fetch(`${API_BASE_URL}/leave/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Leave request submitted successfully');
        await refreshRequests();
        await refreshBalance(user.employeeId); // refresh balance after applying
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ Error submitting leave:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeaveStatus = async (
    id: number, 
    status: LeaveStatus, 
    remarks?: string, 
    remarkType?: 'hr' | 'ovcaa' | 'ovcaf'
  ) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const action = status.includes('rejected') ? 'rejected' : 'approved';

      const response = await fetch(`${API_BASE_URL}/leave/process/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approver_id: user.id,
          approver_role: user.role,
          action,
          remarks
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await refreshRequests();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ Error updating leave status:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeLeaveBalance = (employeeId: string): LeaveBalance | undefined => {
    return leaveBalances.get(employeeId);
  };

  const getEmployeeLeaveHistory = (employeeId: string): LeaveRequest[] => {
    return leaveRequests.filter(request => request.employeeId === employeeId);
  };

  const getPendingRequests = (role: 'hr' | 'ovcaa' | 'ovcaf'): LeaveRequest[] => {
    switch (role) {
      case 'hr': return leaveRequests.filter(r => r.status === 'pending');
      case 'ovcaa': return leaveRequests.filter(r => r.status === 'hr_approved');
      case 'ovcaf': return leaveRequests.filter(r => r.status === 'ovcaa_approved');
      default: return [];
    }
  };

  const getApplicationDetails = async (id: number): Promise<ApplicationDetailsResult | null> => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/leave/details/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          application: data.application,
          attachments: data.attachments || [],
          history: data.history || []
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching application details:', error);
      return null;
    }
  };

  return (
    <LeaveContext.Provider
      value={{
        leaveRequests,
        allRequests,
        leaveBalances,
        isLoading,
        isLoadingAll,
        addLeaveRequest,
        updateLeaveStatus,
        getEmployeeLeaveBalance,
        getEmployeeLeaveHistory,
        getPendingRequests,
        refreshRequests,
        refreshAllRequests,
        refreshBalance,
        getApplicationDetails
      }}
    >
      {children}
    </LeaveContext.Provider>
  );
}

export function useLeave() {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
}