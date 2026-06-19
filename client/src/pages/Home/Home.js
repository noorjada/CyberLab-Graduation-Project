import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ORIGIN } from '../../utils/userUtils';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: null, challenges: null, labs: null });

  useEffect(() => {
    fetch(`${API_ORIGIN}/api/stats`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  const fmt = n => n === null ? '—' : n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;

  return (
    <div className="home">
      <div className="hero">
        <div className="hero-tag">🛡️ Cybersecurity Training Platform</div>
        <h1>Master Real-World <span>Hacking Skills</span></h1>
        <p>Hands-on labs, CTF challenges, and interactive learning — designed for security professionals and students alike.</p>
        <div className="hero-buttons">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Go to Dashboard →</Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary">Start for Free →</Link>
              <Link to="/login" className="btn-secondary">Sign In</Link>
            </>
          )}
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>{fmt(stats.challenges)}</strong>
            <span>Challenges</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <strong>{fmt(stats.labs)}</strong>
            <span>Live Labs</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <strong>{fmt(stats.users)}</strong>
            <span>Students</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <strong>{stats.categories || 5}</strong>
            <span>Categories</span>
          </div>
        </div>
      </div>

      <div className="section-label">What you'll learn</div>
      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🌐</div>
          <h3>Web Security</h3>
          <p>SQL injection, XSS, CSRF, authentication bypass, and OWASP Top 10 vulnerabilities.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Network Security</h3>
          <p>Packet analysis, port scanning, network exploitation, and traffic interception.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🐧</div>
          <h3>Linux & Privesc</h3>
          <p>Linux commands, SUID exploits, cron jobs, and privilege escalation techniques.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Digital Forensics</h3>
          <p>Investigate digital evidence, recover files, and analyze memory artifacts.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <h3>Cryptography</h3>
          <p>Hash cracking, cipher analysis, encoding schemes, and crypto attack patterns.</p>
        </div>
        <Link to={user ? '/reference' : '/register'} className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-icon">📚</div>
          <h3>Cyber Reference</h3>
          <p>Ethical hacking, pentesting, forensics, careers, certs, tools, and curated learning resources.</p>
        </Link>
        <Link to={user ? '/study-plans' : '/register'} className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-icon">📅</div>
          <h3>Study Plans</h3>
          <p>30-day pentester, SOC analyst, and forensics tracks — structured week-by-week with linked labs and challenges.</p>
        </Link>
      </div>

      <div className="how-it-works">
        <div className="section-label">How it works</div>
        <h2>Learn by doing — not just watching</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">01</div>
            <h4>Pick a challenge</h4>
            <p>Choose from CTF challenges or spin up a live Docker hacking lab.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">02</div>
            <h4>Exploit it</h4>
            <p>Use real tools in a real environment — no simulated clicks.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">03</div>
            <h4>Submit the flag</h4>
            <p>Capture the flag, earn points, and climb the leaderboard.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">04</div>
            <h4>Level up</h4>
            <p>Track your progress, unlock badges, and get AI-powered guidance.</p>
          </div>
        </div>
      </div>

      <div className="cta-banner">
        <h2>Ready to start hacking?</h2>
        <p>Join the platform and start your cybersecurity journey today.</p>
        {user ? (
          <Link to="/labs" className="btn-primary">Open Hacking Labs →</Link>
        ) : (
          <Link to="/register" className="btn-primary">Create Free Account →</Link>
        )}
      </div>
    </div>
  );
};

export default Home;
