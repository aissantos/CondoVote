/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './hooks/useToast';

// Resident Pages
import ResidentLogin from './pages/resident/Login';
import ResidentRegister from './pages/resident/Register';
import CompleteProfile from './pages/resident/CompleteProfile';
import ResidentHome from './pages/resident/ResidentHome';
import ResidentProfile from './pages/resident/ResidentProfile';
import ResidentDocuments from './pages/resident/ResidentDocuments';
import ResidentLayout from './layouts/ResidentLayout';
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

// Auth (Globais)
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import ReloadPrompt from './components/ReloadPrompt';
import InstallPrompt from './components/InstallPrompt';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <InstallPrompt />
          <ReloadPrompt />
          <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<ResidentLogin />} />
          <Route path="/register" element={<ResidentRegister />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/super/login" element={<SuperLogin />} />
          
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Rotas Protegidas - Morador */}
          <Route path="/complete-profile" element={
            <ProtectedRoute allowedRoles={['RESIDENT']} requireCompleteProfile={false}>
              <CompleteProfile />
            </ProtectedRoute>
          } />

          {/* Rotas Protegidas - App Morador (PWA Bottom Nav Layout) */}
          <Route element={<ProtectedRoute allowedRoles={['RESIDENT']}><ResidentLayout /></ProtectedRoute>}>
             <Route path="/resident/home" element={<ResidentHome />} />
             <Route path="/resident/assembly" element={<Topics />} />
             <Route path="/resident/documents" element={<ResidentDocuments />} />
             <Route path="/resident/profile" element={<ResidentProfile />} />
          </Route>

          {/* Rotas Protegidas Extras - Morador (Full Screen) */}
          <Route path="/check-in" element={
            <ProtectedRoute allowedRoles={['RESIDENT']}><CheckIn /></ProtectedRoute>
          } />
          <Route path="/voting" element={
            <ProtectedRoute allowedRoles={['RESIDENT']}><Voting /></ProtectedRoute>
          } />
          <Route path="/success" element={
            <ProtectedRoute allowedRoles={['RESIDENT']}><Success /></ProtectedRoute>
          } />

          {/* Rotas Protegidas - Admin */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />

          {/* Rotas Protegidas - SuperAdmin */}
          <Route path="/super/*" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN']}><SuperDashboard /></ProtectedRoute>
          } />
        </Routes>
        </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
