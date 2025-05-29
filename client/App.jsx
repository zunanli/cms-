import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteGuard from './components/RouteGuard';
import { AuthProvider } from './context/AuthProvider';

// Lazy load components
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Upload = React.lazy(() => import('./pages/Upload'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));

const App = () => {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/dashboard"
            element={
              <RouteGuard>
                <Dashboard />
              </RouteGuard>
            }
          />
          <Route
            path="/upload"
            element={
              <RouteGuard>
                <Upload />
              </RouteGuard>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
};

export default App; 