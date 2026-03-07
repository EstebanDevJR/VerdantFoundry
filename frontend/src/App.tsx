import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useTheme } from './hooks/useTheme';
import { useStore } from './store/useStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Research from './pages/Research';
import Agents from './pages/Agents';
import Tools from './pages/Tools';
import Memory from './pages/Memory';
import Settings from './pages/Settings';
import Evolution from './pages/Evolution';
import Kernel from './pages/Kernel';
import Reports from './pages/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  useTheme();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
            <Route path="agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
            <Route path="tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
            <Route path="memory" element={<ProtectedRoute><Memory /></ProtectedRoute>} />
            <Route path="evolution" element={<ProtectedRoute><Evolution /></ProtectedRoute>} />
            <Route path="kernel" element={<ProtectedRoute><Kernel /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
