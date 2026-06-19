import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password, formData.rememberMe);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🛡️ Login to CyberLab</h2>
        <p className="auth-subtitle">Welcome back, hacker!</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
            </div>
          <div className="form-group remember-me">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={e => setFormData({...formData, rememberMe: e.target.checked})}
              />
              <span>Remember me for 30 days</span>
            </label>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
        <button
          type="button"
          className="oauth-btn"
          onClick={async () => {
            try {
              const r = await api.get('/oauth/github/url');
              window.location.href = r.data.url;
            } catch {
              toast.error('GitHub login not configured');
            }
          }}
        >
          Continue with GitHub
        </button>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;