import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to intended destination or communities
    if (localStorage.getItem('isAuthenticated') === 'true' || 
        sessionStorage.getItem('isAuthenticated') === 'true') {
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/communities';
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectTo);
    }
  }, [navigate]);

  const handleAuthSuccess = () => {
    // Redirect to intended destination or communities
    const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/communities';
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
