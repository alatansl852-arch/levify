import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import {
  LayoutDashboard,
  FileText,
  History,
  User,
  Users,
  CheckCircle,
  LogOut,
  Menu,
  X,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const getNavItems = (role: string): NavItem[] => {
  const baseItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  ];

  if (role === 'staff' || role === 'faculty') {
    return [
      ...baseItems,
      { label: 'Apply Leave', href: '/apply-leave', icon: <FileText className="h-5 w-5" /> },
      { label: 'Leave History', href: '/leave-history', icon: <History className="h-5 w-5" /> },
      { label: 'Leave Balance', href: '/leave-balance', icon: <Wallet className="h-5 w-5" /> },
      { label: 'My Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
    ];
  }

  if (role === 'hr') {
    return [
      ...baseItems,
      { label: 'Pending Requests', href: '/pending-requests', icon: <FileText className="h-5 w-5" /> },
      { label: 'All Requests', href: '/all-requests', icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Employees', href: '/employees', icon: <Users className="h-5 w-5" /> },
      { label: 'My Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
    ];
  }

  if (role === 'ovcaa') {
    return [
      ...baseItems,
      { label: 'For Review', href: '/pending-requests', icon: <FileText className="h-5 w-5" /> },
      { label: 'Faculty Records', href: '/employees', icon: <Users className="h-5 w-5" /> },
      { label: 'All Requests', href: '/all-requests', icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'My Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
    ];
  }

  if (role === 'ovcaf') {
    return [
      ...baseItems,
      { label: 'For Approval', href: '/pending-requests', icon: <FileText className="h-5 w-5" /> },
      { label: 'All Requests', href: '/all-requests', icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'My Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
    ];
  }

  return baseItems;
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return null;
  }

  const navItems = getNavItems(user.role);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'staff':   return 'Staff';
      case 'faculty': return 'Faculty';
      case 'hr':      return 'HR Personnel';
      case 'ovcaa':   return 'OVCAA';
      case 'ovcaf':   return 'OVCAF';
      default:        return role;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img
                src="/levify-logo.png"
                alt="Levify Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-bold text-sidebar-foreground">LEVIFY</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  location.pathname === item.href
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-sidebar-border p-4">
            <div className="mb-3 rounded-lg bg-sidebar-accent/30 p-3">
              <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/70">{getRoleLabel(user.role)}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              MSU Marawi Leave Management System
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
              <span>{new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}