import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityPage from './pages/CommunityPage';
import PostPage from './pages/PostPage';
import AuthPage from './pages/AuthPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check authentication status
    const authStatus = localStorage.getItem('isAuthenticated') || sessionStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (authStatus === 'true' && userData) {
      setIsAuthenticated(true);
      const user = JSON.parse(userData);
      setUsername(user.username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setUsername('');
    window.location.href = '/auth';
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-content">
            <Link to="/communities" className="logo">
              <span className="logo-icon">🗨️</span>
              <span className="logo-text">Reddit</span>
            </Link>
            <div className="nav-links">
              <Link to="/communities" className="nav-link">Communities</Link>
              {isAuthenticated ? (
                <>
                  <span className="nav-username">u/{username}</span>
                  <button onClick={handleLogout} className="nav-link logout-btn">
                    Log Out
                  </button>
                </>
              ) : (
                <Link to="/auth" className="nav-link login-link">Log In</Link>
              )}
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/communities" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/:id" element={<CommunityPage />} />
          <Route path="/posts/:id" element={<PostPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

