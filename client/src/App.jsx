import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import QRCreate from './pages/QRCreate.jsx';
import QREdit from './pages/QREdit.jsx';
import QRDetail from './pages/QRDetail.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PublicMultiLink from './pages/PublicMultiLink.jsx';
import PublicVCard from './pages/PublicVCard.jsx';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Guest Route wrapper (prevents access to login/register if already logged in)
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Guest Authentication Routes */}
          <Route 
            path="/login" 
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            } 
          />

          {/* Public Read-Only Scanner Landing Pages */}
          <Route path="/multilink/:id" element={<PublicMultiLink />} />
          <Route path="/vcard/:id" element={<PublicVCard />} />

          {/* Protected Dashboard Workspace Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create" 
            element={
              <ProtectedRoute>
                <QRCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/qr/:id" 
            element={
              <ProtectedRoute>
                <QRDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/qr/:id/edit" 
            element={
              <ProtectedRoute>
                <QREdit />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Catch-All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
