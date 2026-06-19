import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../context/ExamContext';
import './Navbar.css';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar/SearchBar';
import ThemeToggle from './ThemeToggle/ThemeToggle';


const Navbar = () => {
  const { user, logout } = useAuth();
  const { inExam, session } = useExam();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/daily', icon: '🔥', label: 'Daily Challenge' },
    { path: '/challenges', icon: '🚩', label: 'Challenges' },
    { path: '/reference',  icon: '📚', label: 'Cyber Reference'  },
    { path: '/notes',      icon: '📓', label: 'Learning Notes'   },
    { path: '/roadmap', icon: '🗺️', label: 'Roadmap' },
    { path: '/study-plans', icon: '📅', label: 'Study Plans' },
    { path: '/terminal', icon: '💻', label: 'Terminal' },
    { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
    { path: '/recon', icon: '🔭', label: 'Recon Lab' },
    { path: '/virustotal', icon: '🦠', label: 'Malware Lab' },
    { path: '/labs',     icon: '🖥️', label: 'Hacking Labs'       },
    { path: '/exploits',     icon: '🌐', label: 'Cyber Intelligence' },
    { path: '/soc',          icon: '🛡️', label: 'SOC Assistant'      },
    { path: '/certificates', icon: '📜', label: 'Certificates'       },
    { path: '/exams',        icon: '🎓', label: 'Practice Exams'     },
    { path: '/events',      icon: '🏁', label: 'CTF Events'           },
    { path: '/classrooms',  icon: '🏛️', label: 'University Portal'    },
  ];

  if (!user) {
    return (
      <nav className="topbar">
        <div className="topbar-brand">
          <Link to="/">🛡️ CyberLab</Link>
        </div>
        <div className="topbar-links">
          <ThemeToggle variant="topbar" />
          <Link to="/login">Login</Link>
          <Link to="/register" className="register-btn">Register</Link>
        </div>
      </nav>
    );
  }

  const closeMobile = () => setMobileOpen(false);

  if (inExam) {
    return (
      <nav className="exam-mode-navbar">
        <div className="exam-mode-navbar-brand">🛡️ CyberLab</div>
        <div className="exam-mode-navbar-status">
          🔒 Exam in progress{session?.title ? `: ${session.title}` : ''} — navigation locked
        </div>
      </nav>
    );
  }

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/">🛡️ {!collapsed && 'CyberLab'}</Link>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {!collapsed && <SearchBar />}

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMobile}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {(user.role === 'admin' || user.role === 'instructor') && (
            <Link
              to="/builder"
              onClick={closeMobile}
              className={`sidebar-link ${isActive('/builder') ? 'active' : ''}`}
            >
              <span className="sidebar-icon">🛠️</span>
              {!collapsed && <span className="sidebar-label">Challenge Builder</span>}
            </Link>
          )}
          {user.role === 'admin' && (
            <Link
              to="/admin"
              onClick={closeMobile}
              className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
            >
              <span className="sidebar-icon">⚙️</span>
              {!collapsed && <span className="sidebar-label">Admin</span>}
            </Link>
          )}

          <Link
            to="/profile"
            onClick={closeMobile}
            className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}
          >
            <span className="sidebar-icon">👤</span>
            {!collapsed && <span className="sidebar-label">Profile</span>}
          </Link>

          {!collapsed && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-username">{user.username}</span>
                <span className="sidebar-points">⚡ {user.points} pts</span>
              </div>
            </div>
          )}

          {!collapsed ? (
            <ThemeToggle variant="sidebar" />
          ) : (
            <ThemeToggle variant="topbar" />
          )}

          <div className="sidebar-notification">
            <NotificationBell />
            {!collapsed && <span className="sidebar-label">Notifications</span>}
          </div>

          <button className="sidebar-logout" onClick={handleLogout}>
            <span className="sidebar-icon">🚪</span>
            {!collapsed && <span className="sidebar-label">Logout</span>}
          </button>
        </div>
      </div>

      <div className={`sidebar-spacer ${collapsed ? 'collapsed' : ''}`} />
    </>
  );
};

export default Navbar;