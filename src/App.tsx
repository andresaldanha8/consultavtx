import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SurveyWizard } from './components/SurveyWizard';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/admin');
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('vdx_admin_token');
    } catch {
      return null;
    }
  });

  const [adminUsername, setAdminUsername] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('vdx_admin_user');
    } catch {
      return null;
    }
  });

  const [wizardStep, setWizardStep] = useState<number>(0);

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminRoute(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (token: string, username: string) => {
    setAdminToken(token);
    setAdminUsername(username);
    try {
      sessionStorage.setItem('vdx_admin_token', token);
      sessionStorage.setItem('vdx_admin_user', username);
    } catch (e) {
      console.warn('Could not store session storage', e);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAdminUsername(null);
    try {
      sessionStorage.removeItem('vdx_admin_token');
      sessionStorage.removeItem('vdx_admin_user');
    } catch (e) {
      console.warn('Could not clear session storage', e);
    }
  };

  const isLandingOrSuccess = !isAdminRoute && (wizardStep === 0 || wizardStep === 7);

  return (
    <div
      className={`min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 font-sans ${
        isLandingOrSuccess ? 'h-[100dvh] overflow-hidden' : ''
      }`}
    >
      {isAdminRoute && !adminToken && (
        <Header
          isAdminView={false}
          adminUser={null}
          onNavigateHome={navigateToHome}
          onNavigateAdmin={navigateToAdmin}
          onLogout={handleLogout}
        />
      )}

      {isAdminRoute ? (
        adminToken ? (
          <AdminDashboard token={adminToken} onLogout={handleLogout} />
        ) : (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onCancel={navigateToHome}
          />
        )
      ) : (
        <SurveyWizard
          onStepChange={setWizardStep}
          onNavigateAdmin={navigateToAdmin}
        />
      )}

      {isAdminRoute && !adminToken && (
        <Footer
          isAdminView={false}
          onNavigateAdmin={navigateToAdmin}
        />
      )}
    </div>
  );
}
