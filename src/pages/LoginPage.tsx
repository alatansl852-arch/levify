import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login successful!', {
          description: 'Welcome to LEVIFY Leave Management System',
        });

        const savedUser = localStorage.getItem('levify_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          switch (userData.role) {
            case 'staff':
            case 'faculty':
            case 'employee':
              navigate('/dashboard');
              break;
            case 'hr':
            case 'ovcaa':
            case 'ovcaf':
              navigate('/pending-requests');
              break;
            default:
              navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error('Login failed', {
          description: 'Invalid credentials. Please try again.',
        });
      }
    } catch {
      toast.error('An error occurred', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left side - Branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 institutional-header flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGM5Ljk0IDAgMTgtOC4wNTkgMTgtMThzLTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-30" />

        <div className="relative z-10 text-center max-w-md">
          <div className="flex justify-center mb-8">
            <img
              src="/levify-logo.png"
              alt="LEVIFY Logo"
              style={{
                width: '280px',
                height: '280px',
                objectFit: 'contain',
              }}
            />
          </div>

          <p className="text-xl text-primary-foreground/90 mb-8">
            Leave Management System
          </p>
          <p className="text-primary-foreground/80 text-lg">
            Mindanao State University
          </p>
          <p className="text-primary-foreground/70">
            Main Campus, Marawi City
          </p>
        </div>

        <div className="absolute bottom-8 left-8 right-8 text-center">
          <p className="text-primary-foreground/60 text-sm">
            Developed by: Schultz Jay L. Alatan &amp; Jalilah S. Cader
          </p>
        </div>
      </div>

      {/* ── Right side - Login form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-md">

          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/levify-logo.png"
                alt="LEVIFY Logo"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'contain',
                }}
              />
            </div>
            <p className="text-muted-foreground">MSU Marawi Leave Management</p>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-serif">Welcome</CardTitle>
              <CardDescription>
                Sign in to access your leave management portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@msumain.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-dashed">
                <p className="text-xs text-muted-foreground text-center">
                  Enter your institutional email to login.
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            © 2026 MSU Main Marawi - College of Information and Computing Sciences
          </p>
        </div>
      </div>
    </div>
  );
}