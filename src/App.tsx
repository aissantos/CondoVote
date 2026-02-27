/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';

// Resident Pages
import ResidentLogin from './pages/resident/Login';
import ResidentRegister from './pages/resident/Register';
import CompleteProfile from './pages/resident/CompleteProfile';
import CheckIn from './pages/resident/CheckIn';
import Topics from './pages/resident/Topics';
import Voting from './pages/resident/Voting';
import Success from './pages/resident/Success';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';

// SuperAdmin Pages
import SuperLogin from './pages/superadmin/SuperLogin';
import SuperDashboard from './pages/superadmin/SuperDashboard';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeToggle />
        <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<ResidentLogin />} />
          <Route path="/register" element={<ResidentRegister />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/super/login" element={<SuperLogin />} />

          {/* Rotas Protegidas - Morador */}
          <Route path="/complete-profile" element={
            <ProtectedRoute allowedRole="RESIDENT" requireCompleteProfile={false}>
              <CompleteProfile />
            </ProtectedRoute>
          } />
          <Route path="/check-in" element={
            <ProtectedRoute allowedRole="RESIDENT"><CheckIn /></ProtectedRoute>
          } />
          <Route path="/topics" element={
            <ProtectedRoute allowedRole="RESIDENT"><Topics /></ProtectedRoute>
          } />
          <Route path="/voting" element={
            <ProtectedRoute allowedRole="RESIDENT"><Voting /></ProtectedRoute>
          } />
          <Route path="/success" element={
            <ProtectedRoute allowedRole="RESIDENT"><Success /></ProtectedRoute>
          } />

          {/* Rotas Protegidas - Admin */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />

          {/* Rotas Protegidas - SuperAdmin */}
          <Route path="/super/*" element={
            <ProtectedRoute allowedRole="SUPERADMIN"><SuperDashboard /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
