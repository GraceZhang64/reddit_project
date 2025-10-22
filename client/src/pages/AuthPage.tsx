import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to communities
    const authStatus = localStorage.getItem('isAuthenticated') || sessionStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      navigate('/communities');
    }
  }, [navigate]);

  const handleAuthSuccess = () => {
    // Reload the page to update auth state in App.tsx
    window.location.href = '/communities';
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
