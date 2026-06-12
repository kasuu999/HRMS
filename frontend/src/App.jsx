import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
 
// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import AttendancePage from './pages/AttendancePage';
import LeavePage from './pages/LeavePage';
import ApprovalsPage from './pages/ApprovalsPage';
import ReportsPage from './pages/ReportsPage';
import AISearchPage from './pages/AISearchPage';
import Layout from './components/common/Layout';
 
const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return <div className="loading-screen">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};
 
export default function App() {
  const loadUser = useAuthStore(s => s.loadUser);
 
  useEffect(() => { loadUser(); }, []);
 
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="employees" element={<PrivateRoute roles={['hr_admin', 'manager', 'leadership']}><EmployeesPage /></PrivateRoute>} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="approvals" element={<PrivateRoute roles={['manager', 'hr_admin']}><ApprovalsPage /></PrivateRoute>} />
          <Route path="reports" element={<PrivateRoute roles={['hr_admin', 'leadership']}><ReportsPage /></PrivateRoute>} />
          <Route path="ai-search" element={<PrivateRoute roles={['hr_admin', 'manager', 'leadership']}><AISearchPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
 