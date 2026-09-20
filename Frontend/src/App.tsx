import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import LandingPage from './pages/LandingPage';
import { AboutUs } from './pages/AboutUs';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { UploadContract } from './pages/UploadContract';
import { ContractDetails } from './pages/ContractDetails';
import { Obligations } from './pages/Obligations';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageTransition } from './components/PageTransition';

const AppContent: React.FC = () => {
  const location = useLocation();

  // Public standalone pages that do not use the authenticated product header
  const isPublicStandalonePage = ['/', '/about', '/login', '/register'].includes(location.pathname);
  const showHeader = !isPublicStandalonePage;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-white text-black">
        {showHeader && <Header />}
        <main className="flex-1 w-full">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadContract />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute>
                  <ContractDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id/obligations"
              element={
                <ProtectedRoute>
                  <Obligations />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </PageTransition>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
