import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import './CertVerify.css';

const trackColors = { beginner: '#3fb950', intermediate: '#f0c040', advanced: '#f85149' };

const CertVerify = () => {
  const { certId } = useParams();
  const [cert, setCert]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/certificates/verify/${certId}`)
      .then(r => setCert(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [certId]);

  if (loading) return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="verify-skeleton">
          <div className="sk-circle" />
          <div className="sk-line sk-lg" />
          <div className="sk-line sk-md" />
        </div>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="verify-page">
      <div className="verify-card verify-invalid">
        <div className="verify-icon invalid">❌</div>
        <h1>Certificate Not Found</h1>
        <p>This certificate ID does not exist or has been revoked.</p>
        <Link to="/" className="verify-home-btn">← Back to CyberLab</Link>
      </div>
    </div>
  );

  const trackColor = trackColors[cert.pathTrack] || '#58a6ff';
  const dateStr = new Date(cert.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="verify-verified-banner">
          <span className="verify-check">✅</span>
          <span>Certificate Verified — Authentic & Valid</span>
        </div>

        <div className="verify-cert-preview" style={{ borderColor: trackColor + '55' }}>
          <div className="verify-cert-header">
            <span className="verify-platform">🛡️ CyberLab</span>
            <span className="verify-track" style={{ color: trackColor }}>
              {cert.pathTrack?.charAt(0).toUpperCase() + cert.pathTrack?.slice(1)} Track
            </span>
          </div>

          <div className="verify-cert-title">Certificate of Achievement</div>

          <p className="verify-label">This is to certify that</p>
          <h1 className="verify-username">{cert.user?.username}</h1>
          <p className="verify-label">has successfully completed</p>
          <h2 className="verify-path">{cert.pathTitle}</h2>

          <div className="verify-stats">
            <div className="vstat">
              <strong>{cert.totalModules}</strong>
              <span>Modules</span>
            </div>
            <div className="vstat">
              <strong>{cert.xpEarned}</strong>
              <span>XP Earned</span>
            </div>
            <div className="vstat">
              <strong>{dateStr}</strong>
              <span>Completed</span>
            </div>
          </div>
        </div>

        <div className="verify-id-row">
          <span>Certificate ID</span>
          <code>{cert.certificateId}</code>
        </div>

        <div className="verify-share">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noreferrer"
            className="share-btn"
          >Share on LinkedIn</a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${cert.user?.username} earned a CyberLab certificate in ${cert.pathTitle}!`)}&url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noreferrer"
            className="share-btn"
          >Share on X</a>
        </div>

        <Link to="/" className="verify-home-btn">Visit CyberLab →</Link>
      </div>
    </div>
  );
};

export default CertVerify;
