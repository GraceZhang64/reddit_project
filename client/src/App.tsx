import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from './services/auth';
import HomePage from './pages/HomePage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityPage from './pages/CommunityPage';
import PostPage from './pages/PostPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const user = authService.getUser();
          if (user) {
            setIsAuthenticated(true);
            setUsername(user.username);
          } else {
            // Try to fetch current user from API
            const currentUser = await authService.getCurrentUser();
            setIsAuthenticated(true);
            setUsername(currentUser.username);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
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
                <span className="logo-icon">💙</span>
                <span className="logo-text">BlueIt</span>
              </Link>
              <div className="nav-links">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/communities" className="nav-link">Communities</Link>
              </div>
              <div className="nav-actions">
                <Link to="/settings" className="nav-link">Settings</Link>
                <span className="username">u/{username}</span>
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
            path="/p/:id"
            element={isAuthenticated ? <PostPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <SettingsPage /> : <Navigate to="/auth" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

