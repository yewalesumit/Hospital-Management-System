import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context & Layout
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OAuth2Callback from './pages/OAuth2Callback';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import PatientAiAssistant from './pages/patient/PatientAiAssistant';
import PatientInsurance from './pages/patient/PatientInsurance';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAiPanel from './pages/doctor/DoctorAiPanel';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PatientManagement from './pages/admin/PatientManagement';
import OnboardDoctor from './pages/admin/OnboardDoctor';
import AppointmentManagement from './pages/admin/AppointmentManagement';
import DoctorManagement from './pages/admin/DoctorManagement';
import AdminAiPanel from './pages/admin/AdminAiPanel';

// Public AI FAQ
import FaqBot from './pages/FaqBot';

// Smart chat widget
import SmartChatWidget from './components/SmartChatWidget';

// Global Styles
import './index.css';

/* ── Loading spinner shown while auth state is being resolved ── */
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#f9fafb', gap: '16px',
  }}>
    <div style={{
      width: '48px', height: '48px', border: '4px solid #e5e7eb',
      borderTop: '4px solid #4f46e5', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>Loading…</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/** Root: wait for auth to resolve, then always show LandingPage */
const RootRoute = () => {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return <LandingPage />;
};

/** Redirect already-logged-in users away from /login and /signup */
const GuestOnlyRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isDoctor, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) {
    if (isAdmin())  return <Navigate to="/admin/dashboard"   replace />;
    if (isDoctor()) return <Navigate to="/doctor/dashboard"  replace />;
    return                 <Navigate to="/patient/dashboard" replace />;
  }
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/login"  element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
          <Route path="/signup" element={<GuestOnlyRoute><Signup /></GuestOnlyRoute>} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
          <Route path="/faq" element={<FaqBot />} />

          {/* Protected Patient Routes */}
          <Route path="/patient" element={
            <ProtectedRoute roles={['PATIENT']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="book"      element={<BookAppointment />} />
            <Route path="ai"        element={<PatientAiAssistant />} />
            <Route path="insurance" element={<PatientInsurance />} />
          </Route>

          {/* Protected Doctor Routes */}
          <Route path="/doctor" element={
            <ProtectedRoute roles={['DOCTOR']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard"    element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorDashboard />} />
            <Route path="ai"           element={<DoctorAiPanel />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard"    element={<AdminDashboard />} />
            <Route path="patients"     element={<PatientManagement />} />
            <Route path="onboard"      element={<OnboardDoctor />} />
            <Route path="appointments" element={<AppointmentManagement />} />
            <Route path="doctors"      element={<DoctorManagement />} />
            <Route path="ai"           element={<AdminAiPanel />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Smart chat: FAQ bot for guests · AI assistant for logged-in users */}
        <SmartChatWidget />

        <ToastContainer position="bottom-right" theme="colored" autoClose={3000} style={{ bottom: '90px' }} />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
