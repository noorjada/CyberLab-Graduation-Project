import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import '../Login/Login.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setMessage(res.data.message);
        setStatus('success');
      } catch (err) {
        setMessage(err.response?.data?.message || 'Verification failed');
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {status === 'loading' && (
          <>
            <h2>⏳ Verifying Email</h2>
            <p className="auth-subtitle">Please wait...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h2>✅ Email Verified!</h2>
            <p className="auth-subtitle">{message}</p>
            <Link to="/login" className="auth-btn" style={{ display: 'block', textAlign: 'center', marginTop: '1rem' }}>
              🚀 Go to Login
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h2>❌ Verification Failed</h2>
            <p className="auth-subtitle">{message}</p>
            <Link to="/login" className="auth-btn" style={{ display: 'block', textAlign: 'center', marginTop: '1rem' }}>
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;