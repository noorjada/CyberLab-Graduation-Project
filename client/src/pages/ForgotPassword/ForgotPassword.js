import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import '../Login/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔐 Forgot Password</h2>
        <p className="auth-subtitle">
          {sent ? 'Check your email for the reset link!' : 'Enter your email to reset your password'}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Sending...' : '📧 Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="sent-message">
            <div className="sent-icon">📧</div>
            <p>We sent a password reset link to <strong>{email}</strong></p>
            <p className="sent-note">Check your inbox and spam folder. The link expires in 1 hour.</p>
            <button
              className="auth-btn"
              onClick={() => setSent(false)}
              style={{ marginTop: '1rem' }}
            >
              Try another email
            </button>
          </div>
        )}

        <p className="auth-link">
          Remember your password? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;