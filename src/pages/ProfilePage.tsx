import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building2, Briefcase, Calendar, Hash, Shield, Award, BookOpen, MinusCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'hr': return 'secondary';
      case 'ovcaa':
      case 'ovcaf': return 'default';
      default: return 'outline';
    }
  };

  const salaryGrade = user.salary_grade ?? 0;
  const totalLeaveCredits = user.total_leave_credits ?? 0;
  const totalLeaveAvailed = user.total_leave_availed ?? 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="My Profile"
        description="View and manage your account information"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.position}</p>
              <div className="mt-3">
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role === 'faculty' ? 'Faculty' :
                   user.role === 'staff' ? 'Staff' :
                   user.role === 'hr' ? 'HR Personnel' :
                   user.role.toUpperCase()}
                </Badge>
              </div>
              <Separator className="my-6" />
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{user.department}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>{user.employeeId}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Salary Grade {salaryGrade}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal and employment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={user.name} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user.email} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" value={user.employeeId || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={user.department || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={user.position || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryGrade">Salary Grade</Label>
                <Input id="salaryGrade" value={`SG - ${salaryGrade}`} readOnly className="bg-muted" />
              </div>
              {user.rank && (
                <div className="space-y-2">
                  <Label htmlFor="rank">Rank</Label>
                  <Input id="rank" value={user.rank} readOnly className="bg-muted" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Input
                  id="employmentType"
                  value={user.employmentType === 'permanent' ? 'Permanent' :
                         user.employmentType === 'contractual' ? 'Contractual' :
                         user.employmentType || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Profile Information</p>
                  <p className="text-sm text-muted-foreground">
                    Profile information is managed by the Human Resource Management Office.
                    To update your details, please contact HR.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Service Record</span>
                </div>
                <p className="text-2xl font-bold">5 years</p>
                <p className="text-sm text-muted-foreground">Years of Service</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Unit/Office</span>
                </div>
                <p className="text-lg font-bold">{user.department}</p>
                <p className="text-sm text-muted-foreground">Current Assignment</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Status</span>
                </div>
                <p className="text-lg font-bold capitalize">{user.employmentType}</p>
                <p className="text-sm text-muted-foreground">Employment Status</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Total Credits</span>
                </div>
                <p className="text-2xl font-bold">{Number(totalLeaveCredits).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Lifetime Leave Credits</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <MinusCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Total Availed</span>
                </div>
                <p className="text-2xl font-bold">{Number(totalLeaveAvailed).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Days Used / Monetized</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}