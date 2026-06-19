import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './Certificates.css';

const trackColors = { beginner: '#3fb950', intermediate: '#f0c040', advanced: '#f85149' };
const trackLabels = { beginner: '🌱 Beginner', intermediate: '⚡ Intermediate', advanced: '💀 Advanced' };
const careerLabels = { pentester: '⚔️ Pentester', soc: '🛡️ SOC', forensics: '🔍 Forensics', general: '🎯 General' };

const Certificates = () => {
  const [certs, setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/certificates/my'),
      api.get('/courses/certificates/my').catch(() => ({ data: [] }))
    ])
      .then(([pathRes, courseRes]) => {
        const pathCerts = (pathRes.data || []).map(c => ({ ...c, type: 'path' }));
        const courseCerts = courseRes.data || [];
        setCerts([...courseCerts, ...pathCerts].sort((a, b) =>
          new Date(b.completedAt) - new Date(a.completedAt)
        ));
      })
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert) => {
    try {
      const res = await api.get(`/certificates/${cert.certificateId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `CyberLab-Certificate-${cert.certificateId.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download certificate');
    }
  };

  const copyLink = (certId) => {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${certId}`);
    toast.success('Verification link copied!');
  };

  if (loading) return (
    <div className="certs-page">
      <div className="certs-header"><h1>📜 My Certificates</h1></div>
      <div className="certs-grid">
        {[1,2,3].map(i => <div key={i} className="cert-card-sk"><div className="sk-line sk-lg"/><div className="sk-line sk-md"/><div className="sk-line sk-sm"/></div>)}
      </div>
    </div>
  );

  return (
    <div className="certs-page">
      <div className="certs-header">
        <div>
          <h1>📜 My Certificates</h1>
          <p>Certificates earned by completing learning paths</p>
        </div>
        <Link to="/roadmap" className="roadmap-btn">Go to Roadmap →</Link>
      </div>

      {certs.length === 0 ? (
        <div className="certs-empty">
          <div className="empty-icon">📜</div>
          <h2>No certificates yet</h2>
          <p>Complete a learning path or instructor course to earn a certificate.</p>
          <Link to="/roadmap" className="start-btn">Start a Learning Path →</Link>
        </div>
      ) : (
        <>
          <div className="certs-count">{certs.length} certificate{certs.length !== 1 ? 's' : ''} earned</div>
          <div className="certs-grid">
            {certs.map(cert => (
              <div key={cert._id} className="cert-card">
                <div className="cert-card-glow" style={{ background: cert.type === 'course' ? '#3fb95022' : `${trackColors[cert.pathTrack]}22` }} />
                <div className="cert-top">
                  <span className="cert-icon">{cert.type === 'course' ? (cert.course?.icon || '📘') : (cert.pathIcon || '🛡️')}</span>
                  <div className="cert-track-badge" style={{ color: cert.type === 'course' ? '#3fb950' : trackColors[cert.pathTrack], background: cert.type === 'course' ? '#3fb95022' : `${trackColors[cert.pathTrack]}22` }}>
                    {cert.type === 'course' ? '👨‍🏫 Instructor Course' : (trackLabels[cert.pathTrack] || cert.pathTrack)}
                  </div>
                </div>
                <h2 className="cert-title">{cert.pathTitle || cert.courseTitle}</h2>
                <div className="cert-meta">
                  {cert.type === 'course' ? (
                    <>
                      <span>Instructor: {cert.instructorName}</span>
                      <span>📝 Exam: {cert.finalExamScore}%</span>
                    </>
                  ) : (
                    <>
                      <span>{careerLabels[cert.pathCareerPath] || cert.pathCareerPath}</span>
                      <span>📦 {cert.totalModules} modules</span>
                      <span>⚡ {cert.xpEarned} XP</span>
                    </>
                  )}
                </div>
                <div className="cert-date">
                  Completed {new Date(cert.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="cert-id">ID: {cert.certificateId.slice(0, 18).toUpperCase()}…</div>
                <div className="cert-actions">
                  {cert.type !== 'course' && (
                    <button className="cert-download-btn" onClick={() => handleDownload(cert)}>
                      ⬇️ Download PDF
                    </button>
                  )}
                  <button className="cert-share-btn" onClick={() => copyLink(cert.certificateId)}>
                    🔗 Copy ID
                  </button>
                  {cert.type !== 'course' && (
                    <Link to={`/verify/${cert.certificateId}`} className="cert-verify-btn" target="_blank">
                      ✅ Verify
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Certificates;
