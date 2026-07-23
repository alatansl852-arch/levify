import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LeaveProvider } from "./contexts/LeaveContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ApplyLeavePage from "./pages/ApplyLeavePage";
import LeaveHistoryPage from "./pages/LeaveHistoryPage";
import LeaveBalancePage from "./pages/LeaveBalancePage";
import PendingRequestsPage from "./pages/PendingRequestsPage";
import MonetizationPage from "./pages/MonetizationPage";
import EmployeesPage from "./pages/EmployeesPage";
import HistoryPage from "./pages/AllRequestsPage";
import ProfilePage from "./pages/ProfilePage";
import PrintLeaveForm from "./pages/PrintLeaveForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login route */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <LoginPage />
        } 
      />
      
      {/* Add /login as an alias */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <LoginPage />
        } 
      />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/apply-leave" element={<ProtectedRoute><ApplyLeavePage /></ProtectedRoute>} />
      <Route path="/leave-history" element={<ProtectedRoute><LeaveHistoryPage /></ProtectedRoute>} />
      <Route path="/leave-balance" element={<ProtectedRoute><LeaveBalancePage /></ProtectedRoute>} />
      <Route path="/pending-requests" element={<ProtectedRoute><PendingRequestsPage /></ProtectedRoute>} />
      <Route path="/monetization" element={<ProtectedRoute><MonetizationPage /></ProtectedRoute>} />
      {/* All Requests now points to the merged History page (was /reports) */}
      <Route path="/all-requests" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      {/* Printable CSC leave form, opened after OVCAF gives final approval */}
      <Route path="/print-leave/:id" element={<ProtectedRoute><PrintLeaveForm /></ProtectedRoute>} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <LeaveProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </LeaveProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;