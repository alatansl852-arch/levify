// src/services/apiService.ts
// API Service for communicating with the backend

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// Leave Request Types
export interface CreateLeaveRequest {
  user_id: number;
  employee_name: string;
  department: string;
  position: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  is_monetization?: boolean;
  monetization_days?: number;
  location?: string;
  hospital_details?: string;
  commutation?: string;
}

export interface LeaveRequestResponse {
  id: number;
  reference_no: string;
  user_id: number;
  employee_name: string;
  department: string;
  position: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  status: string;
  created_at: string;
  hr_remarks?: string;
  ovcaa_remarks?: string;
  ovcaf_remarks?: string;
  is_monetization?: boolean;
  monetization_days?: number;
  location?: string;
  hospital_details?: string;
  commutation?: string;
}

export interface LeaveBalanceResponse {
  id: number;
  user_id: number;
  vacation_leave: string;
  sick_leave: string;
  special_privilege: number;
  forced_leave: number;
  total_earned: string;
  total_used: number;
  year: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  department?: string;
  position?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Leave Request API
export const leaveRequestAPI = {
  getAll: async (): Promise<LeaveRequestResponse[]> => {
    return apiRequest<LeaveRequestResponse[]>('/leave-requests');
  },

  getById: async (id: number): Promise<LeaveRequestResponse> => {
    return apiRequest<LeaveRequestResponse>(`/leave-requests/${id}`);
  },

  getByUserId: async (userId: number): Promise<LeaveRequestResponse[]> => {
    return apiRequest<LeaveRequestResponse[]>(`/leave-requests/user/${userId}`);
  },

  create: async (data: CreateLeaveRequest): Promise<LeaveRequestResponse> => {
    return apiRequest<LeaveRequestResponse>('/leave-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (
    id: number,
    status: string,
    remarks?: string,
    remarkType?: 'hr' | 'ovcaa' | 'ovcaf'
  ): Promise<LeaveRequestResponse> => {
    const body: Record<string, string> = { status };
    
    if (remarks && remarkType) {
      body[`${remarkType}_remarks`] = remarks;
    }

    return apiRequest<LeaveRequestResponse>(`/leave-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/leave-requests/${id}`, {
      method: 'DELETE',
    });
  },
};

// Leave Balance API
export const leaveBalanceAPI = {
  getBalance: async (userId: number): Promise<LeaveBalanceResponse> => {
    return apiRequest<LeaveBalanceResponse>(`/leave-balances/${userId}`);
  },

  update: async (
    userId: number,
    data: Partial<LeaveBalanceResponse>
  ): Promise<LeaveBalanceResponse> => {
    return apiRequest<LeaveBalanceResponse>(`/leave-balances/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  create: async (
    userId: number,
    year: number
  ): Promise<LeaveBalanceResponse> => {
    return apiRequest<LeaveBalanceResponse>('/leave-balances', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, year }),
    });
  },
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest<User>('/auth/me');
  },
};