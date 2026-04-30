/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { OrderProvider } from './components/OrderContext';
import { Shell, MobileBottomNav } from './components/Navigation';

// Lazy load views for better performance
import { Dashboard } from './views/Dashboard';
import { Directory } from './views/Directory';
import { AISante } from './views/AISante';
import { MapView } from './views/MapView';
import { Profile } from './views/Profile';
import { Login } from './views/Login';
import { Signup } from './views/Signup';
import { Landing } from './views/Landing';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/welcome" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Shell>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/directory" element={<Directory />} />
                    <Route path="/map" element={<MapView />} />
                    <Route path="/ai-sante" element={<AISante />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </Shell>
                <MobileBottomNav />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </OrderProvider>
    </AuthProvider>
  );
}
