import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { isChallengeSolved } from '../../utils/userUtils';
import './CertificateProgressStep.css';

const CertificateProgressStep = ({
  itemType,
  itemCategory,
  itemTitle,
  points = 0,
  isItemCompleted
}) => {
  const { user } = useAuth();
  const [paths, setPaths] = useState([]);
  const [certs, setCerts] = useState([]);
  const [stats, setStats] = useState({
    labs: { done: 0, total: 0 },
    challenges: { done: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/paths').catch(() => ({ data: [] })),
      api.get('/certificates/my').catch(() => ({ data: [] })),
      api.get('/labs').catch(() => ({ data: [] })),
      api.get('/challenges').catch(() => ({ data: [] }))
    ]).then(([pRes, cRes, lRes, chRes]) => {
      setPaths(pRes.data || []);
      setCerts(cRes.data || []);
      const labs = lRes.data || [];
      const challenges = chRes.data || [];
      const catLabs = labs.filter(l => l.category === itemCategory);
      const catChallenges = challenges.filter(c => c.category === itemCategory);
      setStats({
        labs: {
          done: catLabs.filter(l => l.completed).length,
          total: catLabs.length
        },
        challenges: {
          done: catChallenges.filter(c => isChallengeSolved(user?.solvedChallenges, c._id)).length,
          total: catChallenges.length
        }
      });
    }).finally(() => setLoading(false));
  }, [itemCategory, user?.solvedChallenges]);

  const relatedPath = paths.find(p =>
    p.modules?.some(m =>
      m.topics?.some(t => t.toLowerCase().includes((itemCategory || '').toLowerCase()))
    ) ||
    p.title?.toLowerCase().includes((itemCategory || '').toLowerCase())
  );

  const pathProgress = relatedPath?.progress ?? null;

  if (loading) {
    return <p className="cert-step-loading">Loading certificate progress...</p>;
  }

  return (
    <div className="cert-progress-step">
      <p className="cert-step-intro">
        Completing <strong>{itemTitle}</strong> contributes to your CyberLab credentials and roadmap progress.
      </p>

      <div className="cert-progress-grid">
        <div className="cert-stat-card">
          <span className="cert-stat-icon">⚡</span>
          <div>
            <strong>{user?.xp || user?.points || 0} XP</strong>
            <span>Level {user?.level || 1}</span>
          </div>
          {isItemCompleted ? (
            <span className="cert-earned">+{points} pts earned</span>
          ) : (
            <span className="cert-potential">+{points} pts on completion</span>
          )}
        </div>

        <div className="cert-stat-card">
          <span className="cert-stat-icon">📜</span>
          <div>
            <strong>{certs.length}</strong>
            <span>Certificate{certs.length !== 1 ? 's' : ''} earned</span>
          </div>
          <Link to="/certificates" className="cert-link">View all →</Link>
        </div>

        <div className="cert-stat-card">
          <span className="cert-stat-icon">🖥️</span>
          <div>
            <strong>{stats.labs.done}/{stats.labs.total}</strong>
            <span>{itemCategory} labs complete</span>
          </div>
        </div>

        <div className="cert-stat-card">
          <span className="cert-stat-icon">🚩</span>
          <div>
            <strong>{stats.challenges.done}/{stats.challenges.total}</strong>
            <span>{itemCategory} challenges solved</span>
          </div>
        </div>
      </div>

      {relatedPath && (
        <div className="cert-path-block">
          <div className="cert-path-header">
            <span>{relatedPath.icon || '🗺️'}</span>
            <div>
              <strong>{relatedPath.title}</strong>
              <span>
                Roadmap path · {relatedPath.completedModules}/{relatedPath.totalModules} modules · {pathProgress}%
              </span>
            </div>
          </div>
          <div className="cert-path-bar">
            <div className="cert-path-fill" style={{ width: `${pathProgress}%` }} />
          </div>
          {pathProgress >= 100 ? (
            <p className="cert-path-msg success">🎉 Path complete — claim your certificate on the Roadmap!</p>
          ) : (
            <p className="cert-path-msg">Finish all modules to earn a signed CyberLab certificate.</p>
          )}
          <Link to="/roadmap" className="cert-roadmap-link">Open Roadmap →</Link>
        </div>
      )}

      {!relatedPath && (
        <div className="cert-path-block muted">
          <p>Explore the <Link to="/roadmap">Roadmap</Link> to earn certificates for structured learning paths.</p>
        </div>
      )}

      <div className="cert-flow-recap">
        <span className="done">📖 Lesson</span>
        <span>→</span>
        <span className="done">🎬 Video</span>
        <span>→</span>
        <span className="done">❓ Quiz</span>
        <span>→</span>
        <span className={isItemCompleted ? 'done' : 'current'}>
          {itemType === 'lab' ? '🎯 Lab' : '🎯 Challenge'}
        </span>
        <span>→</span>
        <span className="current">📜 Certificate</span>
      </div>
    </div>
  );
};

export default CertificateProgressStep;
