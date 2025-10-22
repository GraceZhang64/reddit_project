import { useState, FormEvent } from 'react';
import './LoginForm.css';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!usernameOrEmail || !password) {
      setError('Please enter both username/email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Mock login - replace with actual API call
      // const response = await axios.post('/api/auth/login', { 
      //   usernameOrEmail, 
      //   password,
      //   rememberMe 
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - accept any credentials for demo
      if (password.length < 3) {
        throw new Error('Invalid credentials');
      }

      // Store mock user data
      const userData = {
        id: Date.now(),
        username: usernameOrEmail,
        email: `${usernameOrEmail}@example.com`,
        createdAt: new Date().toISOString()
      };
      
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('isAuthenticated', 'true');
      }

      // Success
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <div className="login-header">
          <h2>Log In</h2>
          <p>Welcome back to Reddit</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label htmlFor="usernameOrEmail">Username or Email</label>
            <input
              type="text"
              id="usernameOrEmail"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Enter your username or email"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="link-button forgot-password">
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="form-footer">
          <p>
            Don't have an account?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToRegister}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
