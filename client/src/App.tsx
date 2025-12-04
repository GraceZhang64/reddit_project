import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from './services/auth';
import { useTheme } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityPage from './pages/CommunityPage';
import PostPage from './pages/PostPage';
import SearchPage from './pages/SearchPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import UserProfilePage from './pages/UserProfilePage';
import SavedPostsPage from './pages/SavedPostsPage';
import './App.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status from stored data and validate token
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        const user = authService.getUser();

        // Check if user has stored auth data

        if (token && user) {
          // Validate token by calling /me endpoint
          try {
            const currentUser = await authService.getCurrentUser();
            setIsAuthenticated(true);
            setUsername(currentUser.username);
            // Auth validation successful
          } catch (validationError) {
            // Token validation failed
            // Token is invalid, clear auth data
            authService.clearAuthData();
            setIsAuthenticated(false);
            setUsername('');
          }
        } else {
          console.log('ℹ️ No stored auth data');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('🚫 Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUsername('');
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated ? (
          <nav className="navbar">
            <div className="nav-content">
              <Link to="/" className="logo">
                <img src="/blue%20logo.png" alt="BlueIt" className="logo-icon" />
                <span className="logo-text">BlueIt</span>
              </Link>
              <div className="nav-links">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/communities" className="nav-link">Communities</Link>
                <Link to="/saved" className="nav-link">Saved</Link>
                <Link to="/search" className="nav-link">Search</Link>
              </div>
              <div className="nav-actions">
                <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <Link to={`/u/${username}`} className="username" title="Your profile">u/{username}</Link>
                <Link to="/settings" className="nav-link settings-link" title="Settings">⚙️</Link>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </nav>
        ) : null}

        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={isAuthenticated ? <HomePage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/communities"
            element={isAuthenticated ? <CommunitiesPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/c/:slug"
            element={isAuthenticated ? <CommunityPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/communities/:slug"
            element={isAuthenticated ? <CommunityPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/p/:id"
            element={isAuthenticated ? <PostPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/search"
            element={isAuthenticated ? <SearchPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <SettingsPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/u/:username"
            element={isAuthenticated ? <UserProfilePage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/saved"
            element={isAuthenticated ? <SavedPostsPage /> : <Navigate to="/auth" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

