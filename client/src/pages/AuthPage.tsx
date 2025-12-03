import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in with valid auth, redirect to intended destination or home
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && user) {
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectTo);
    }
  }, [navigate]);

  const handleAuthSuccess = () => {
    // Full page reload to trigger App.tsx auth check with new credentials
    const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectTo;
  };

  return (
    <>
      {mode === 'login' ? (
        <LoginForm 
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => setMode('register')}
        />
      ) : (
        <RegisterForm 
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </>
  );
}
