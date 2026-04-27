import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext.tsx';
import { SettingsProvider, useSettings } from './context/SettingsContext.tsx';
import { User } from './types.ts';
import { supabase } from './services/supabaseClient.ts';
import Layout from './components/Layout.tsx';
import Landing from './pages/Landing.tsx';
import Register from './pages/Register.tsx';
import Login from './pages/Login.tsx';
import Welcome from './pages/Welcome.tsx';
import Portal from './pages/Portal.tsx';
import Module1 from './pages/Module1.tsx';
import Module2 from './pages/Module2.tsx';
import Module3 from './pages/Module3.tsx';
import Module4 from './pages/Module4.tsx';
import Module5 from './pages/Module5.tsx'; 
import TestFinal from './pages/TestFinal.tsx';
import Interview from './pages/Interview.tsx';
import AccessDenied from './pages/AccessDenied.tsx';
import UpdatePassword from './pages/UpdatePassword.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import Contract from './pages/Contract.tsx';
import ScrollToTop from './components/ScrollToTop.tsx';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  check?: (user: User) => boolean;
}

const ProtectedRoute = ({ children, check }: ProtectedRouteProps) => {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" />;
  
  const isAdmin = user.is_admin_session || user.email === 'admin@redescomerciales.ai' || user.email === 'ia@acceleralia.com';
  
  if (check && !check(user) && !isAdmin) return <Navigate to="/acceso-denegado" />;
  return <>{children}</>;
};

const AuthListener = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate('/update-password');
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [navigate]);
  return null;
};

const AppRoutes = () => {
  return (
    <>
      <AuthListener />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/bienvenida" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
        <Route path="/portal" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
        <Route path="/modulo1" element={<ProtectedRoute><Module1 /></ProtectedRoute>} />
        <Route path="/modulo2" element={<ProtectedRoute check={(u) => u.m1_completed}><Module2 /></ProtectedRoute>} />
        <Route path="/modulo3" element={<ProtectedRoute check={(u) => u.m2_completed}><Module3 /></ProtectedRoute>} />
        <Route path="/modulo4" element={<ProtectedRoute check={(u) => u.m3_completed}><Module4 /></ProtectedRoute>} />
        <Route path="/modulo5" element={<ProtectedRoute check={(u) => u.m4_completed}><Module5 /></ProtectedRoute>} />
        <Route path="/test-final" element={<ProtectedRoute check={(u) => u.m4_completed}><TestFinal /></ProtectedRoute>} />
        <Route path="/contrato" element={<ProtectedRoute check={(u) => u.m5_completed || u.test_passed}><Contract /></ProtectedRoute>} />
        <Route path="/entrevista" element={<ProtectedRoute check={(u) => u.m5_completed || u.test_passed}><Interview /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/acceso-denegado" element={<AccessDenied />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <SettingsProvider>
        <UserProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </UserProvider>
      </SettingsProvider>
    </Router>
  );
};

export default App;