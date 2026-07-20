import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Users, Search, Eye, Filter, Download, Mail, Building2, Briefcase,
  CalendarCheck, CalendarX, BookOpen, MinusCircle, Award,
} from 'lucide-react';

interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  position: string;
  employee_type: 'teaching' | 'non-teaching';
  employment_type: 'permanent' | 'contractual';
  vacation_leave_balance: number;
  sick_leave_balance: number;
  special_privilege_leave_balance?: number;
  forced_leave_balance?: number;
  // ✅ NEW fields (now returned by the backend)
  total_leave_credits?: number;
  total_leave_availed?: number;
  salary_grade?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // state for the details modal
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [user?.role]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('levify_token');
      
      const response = await fetch(`${API_BASE_URL}/employees/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        let filteredEmployees = data.employees;

        // Filter based on user role
        if (user?.role === 'ovcaa') {
          // OVCAA sees only faculty (teaching)
          filteredEmployees = filteredEmployees.filter(
            (emp: Employee) => emp.employee_type === 'teaching'
          );
        }
        // HR and OVCAF see all employees (no filtering needed)

        setEmployees(filteredEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      typeFilter === 'all' || 
      (typeFilter === 'faculty' && emp.employee_type === 'teaching') ||
      (typeFilter === 'staff' && emp.employee_type === 'non-teaching');
    
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;

    return matchesSearch && matchesType && matchesDept;
  });

  const departments = [...new Set(employees.map((e) => e.department))].sort();

  const getPageTitle = () => {
    if (user?.role === 'ovcaa') return 'Faculty Records';
    return 'Employee Records';
  };

  const getPageDescription = () => {
    if (user?.role === 'ovcaa') return 'View and manage faculty information and leave balances';
    return 'View and manage employee information and leave balances';
  };

  const handleViewDetails = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDetailsOpen(true);
  };

  // simple eligibility check — has at least half a day of either leave type available
  const getEligibility = (emp: Employee) => {
    const vl = Number(emp.vacation_leave_balance) || 0;
    const sl = Number(emp.sick_leave_balance) || 0;
    return vl >= 0.5 || sl >= 0.5;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={getPageTitle()}
        description={getPageDescription()}
      >
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                {user?.role === 'ovcaa' ? 'Faculty Directory' : 'Employee Directory'}
              </CardTitle>
              <CardDescription>
                {isLoading ? (
                  'Loading employees...'
                ) : (
                  `${filteredEmployees.length} of ${employees.length} ${
                    user?.role === 'ovcaa' ? 'faculty members' : 'employees'
                  }`
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              
              {/* Show type filter only for HR and OVCAF (who see both staff and faculty) */}
              {user?.role !== 'ovcaa' && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>VL Balance</TableHead>
                  <TableHead>SL Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id} className="table-row-hover">
                      <TableCell className="font-mono text-sm">{emp.employee_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {emp.department}
                      </TableCell>
                      <TableCell className="text-sm">{emp.position}</TableCell>
                      <TableCell>
                        <Badge variant={emp.employee_type === 'teaching' ? 'default' : 'secondary'}>
                          {emp.employee_type === 'teaching' ? 'Faculty' : 'Staff'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {emp.vacation_leave_balance ? Number(emp.vacation_leave_balance).toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {emp.sick_leave_balance ? Number(emp.sick_leave_balance).toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(emp)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No employees found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employee details modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[520px]">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedEmployee.full_name}</DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  {selectedEmployee.employee_id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEmployee.department}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEmployee.position}</span>
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Badge variant={selectedEmployee.employee_type === 'teaching' ? 'default' : 'secondary'}>
                    {selectedEmployee.employee_type === 'teaching' ? 'Faculty' : 'Staff'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedEmployee.employment_type}
                  </Badge>
                  {selectedEmployee.salary_grade ? (
                    <Badge variant="outline">SG - {selectedEmployee.salary_grade}</Badge>
                  ) : null}
                </div>

                {/* Current balances */}
                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Vacation Leave</p>
                    <p className="text-lg font-semibold text-primary">
                      {Number(selectedEmployee.vacation_leave_balance || 0).toFixed(2)} days
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Sick Leave</p>
                    <p className="text-lg font-semibold text-primary">
                      {Number(selectedEmployee.sick_leave_balance || 0).toFixed(2)} days
                    </p>
                  </div>
                </div>

                {/* ✅ NEW: Lifetime totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Total Leave Credits (Lifetime)
                    </span>
                    <span className="font-medium">
                      {Number(selectedEmployee.total_leave_credits || 0).toFixed(2)} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MinusCircle className="h-4 w-4" />
                      Total Leave Availed / Monetized
                    </span>
                    <span className="font-medium">
                      {Number(selectedEmployee.total_leave_availed || 0).toFixed(2)} days
                    </span>
                  </div>
                  {selectedEmployee.salary_grade ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Salary Grade
                      </span>
                      <span className="font-medium">SG - {selectedEmployee.salary_grade}</span>
                    </div>
                  ) : null}
                </div>

                <div className="border-t pt-4 flex items-center gap-2">
                  {getEligibility(selectedEmployee) ? (
                    <>
                      <CalendarCheck className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Eligible to file for leave
                      </span>
                    </>
                  ) : (
                    <>
                      <CalendarX className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-700">
                        Insufficient leave balance
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}