import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

const OAuthCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get('code');
    if (!code) { navigate('/login'); return; }

    api.post('/oauth/github/callback', { code })
      .then(res => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.location.href = '/dashboard';
      })
      .catch(() => navigate('/login'));
  }, [params, navigate]);

  return <div style={{ padding: '2rem', textAlign: 'center' }}>Signing in with GitHub...</div>;
};

export default OAuthCallback;
