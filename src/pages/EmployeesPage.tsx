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
import { Users, Search, Eye, Filter, Download } from 'lucide-react';

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
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

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
                        <Button variant="ghost" size="sm">
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
    </DashboardLayout>
  );
}