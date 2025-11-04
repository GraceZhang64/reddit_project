import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
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
        {isAuthenticated ? (
          <nav className="navbar">
            <div className="nav-content">
              <Link to="/" className="logo">
                <span className="logo-icon">🗨️</span>
                <span className="logo-text">Reddit</span>
              </Link>
              <div className="nav-links">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/communities" className="nav-link">Communities</Link>
              </div>
              <div className="nav-actions">
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
            path="/communities/:id"
            element={isAuthenticated ? <CommunityPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/posts/:id"
            element={isAuthenticated ? <PostPage /> : <Navigate to="/auth" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

