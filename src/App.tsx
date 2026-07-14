/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { OrderProvider } from './components/OrderContext';
import { Shell } from './components/Navigation';

// Lazy-loaded routes as per Technical Document R1/R2 optimization
const Dashboard = lazy(() => import('./views/Dashboard').then(m => ({ default: m.Dashboard })));
const Directory = lazy(() => import('./views/Directory').then(m => ({ default: m.Directory })));
const AISante = lazy(() => import('./views/AISante').then(m => ({ default: m.AISante })));
const MapView = lazy(() => import('./views/MapView').then(m => ({ default: m.MapView })));
const Profile = lazy(() => import('./views/Profile').then(m => ({ default: m.Profile })));
const Login = lazy(() => import('./views/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./views/Signup').then(m => ({ default: m.Signup })));
const Landing = lazy(() => import('./views/Landing').then(m => ({ default: m.Landing })));
const VerifyEmail = lazy(() => import('./views/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const Orders = lazy(() => import('./views/Orders').then(m => ({ default: m.Orders })));
const Inventory = lazy(() => import('./views/Inventory').then(m => ({ default: m.Inventory })));
const PharmacistOnboarding = lazy(() => import('./views/PharmacistOnboarding').then(m => ({ default: m.PharmacistOnboarding })));
const AdminDashboard = lazy(() => import('./views/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/welcome" replace />;
  
  // If the user is a pharmacist and not activated, show the onboarding screen
  if (profile?.role === 'pharmacist' && profile?.status !== 'activated') {
    return <PharmacistOnboarding />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Shell>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/directory" element={<Directory />} />
                    <Route path="/map" element={<MapView />} />
                    <Route path="/ai-sante" element={<AISante />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />
                  </Routes>
                </Shell>
              </ProtectedRoute>
            } />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </OrderProvider>
    </AuthProvider>
  );
}
