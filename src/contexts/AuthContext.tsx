// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'staff' | 'faculty' | 'hr' | 'ovcaa' | 'ovcaf';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  position?: string;
  employeeId?: string;
  rank?: string;
  employmentType?: 'permanent' | 'contractual';
  salary_grade?: number;
  total_leave_credits?: number;
  total_leave_availed?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('levify_user');
    const savedToken = localStorage.getItem('levify_token');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('✅ User loaded from localStorage:', parsedUser.email, parsedUser.role);
      } catch (error) {
        console.error('❌ Error loading saved user:', error);
        localStorage.removeItem('levify_user');
        localStorage.removeItem('levify_token');
      }
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const determineEmployeeRole = (backendUser: any): UserRole => {
    if (backendUser.role && backendUser.role !== 'employee') {
      return backendUser.role as UserRole;
    }

    if (backendUser.employee_type === 'teaching' || backendUser.employeeType === 'teaching') {
      console.log('🎓 Identified as FACULTY (employee_type = teaching)');
      return 'faculty';
    }
    if (backendUser.employee_type === 'non-teaching' || backendUser.employeeType === 'non-teaching') {
      console.log('💼 Identified as STAFF (employee_type = non-teaching)');
      return 'staff';
    }

    const dept = (backendUser.department || '').toLowerCase();
    const facultyKeywords = [
      'college of', 'cbaa', 'cfas', 'chs', 'cics', 'cnsm',
      'col', 'cssh', 'coe', 'ced', 'agriculture'
    ];
    
    if (facultyKeywords.some(keyword => dept.includes(keyword))) {
      console.log('🎓 Identified as FACULTY (department contains college keyword)');
      return 'faculty';
    }

    const position = (backendUser.position || '').toLowerCase();
    const teachingPositions = [
      'instructor', 'professor', 'prof', 'assoc. prof',
      'asst. prof', 'lecturer', 'faculty'
    ];
    
    if (teachingPositions.some(keyword => position.includes(keyword))) {
      console.log('🎓 Identified as FACULTY (teaching position)');
      return 'faculty';
    }

    const salaryGrade = backendUser.salary_grade || backendUser.salaryGrade;
    if (salaryGrade >= 12 && position.match(/(instructor|professor)/i)) {
      console.log('🎓 Identified as FACULTY (salary grade + position combo)');
      return 'faculty';
    }

    console.log('💼 Defaulting to STAFF (no faculty indicators found)');
    return 'staff';
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('🔵 Attempting login to:', `${API_BASE_URL}/auth/login`);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔵 Backend response:', data);

      if (data.success && data.user) {
        const userRole = determineEmployeeRole(data.user);

        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: userRole,
          department: data.user.department,
          position: data.user.position,
          employeeId: data.user.employee_id || data.user.employeeId,
          rank: data.user.rank,
          employmentType: data.user.employment_type || data.user.employmentType as 'permanent' | 'contractual',
          salary_grade: data.user.salary_grade || 0,
          total_leave_credits: data.user.total_leave_credits || 0,
          total_leave_availed: data.user.total_leave_availed || 0,
        };

        console.log('✅ Login successful!');
        console.log('   Name:', userData.name);
        console.log('   Role:', userData.role);
        console.log('   Salary Grade:', userData.salary_grade);
        console.log('   Total Leave Credits:', userData.total_leave_credits);
        console.log('   Total Leave Availed:', userData.total_leave_availed);

        setUser(userData);
        localStorage.setItem('levify_user', JSON.stringify(userData));
        localStorage.setItem('levify_token', data.token);

        setIsLoading(false);
        return true;
      } else {
        console.log('❌ Login failed:', data.message);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('👋 Logging out...');
    setUser(null);
    localStorage.removeItem('levify_user');
    localStorage.removeItem('levify_token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}