import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import api from '../../utils/api';
import { API_BASE_URL } from '../../utils/userUtils';
import './Roadmap.css';

const trackInfo = {
  beginner: { label: 'Beginner', color: '#3fb950', icon: '🌱' },
  intermediate: { label: 'Intermediate', color: '#f0c040', icon: '⚡' },
  advanced: { label: 'Advanced', color: '#f85149', icon: '💀' }
};

const careerInfo = {
  general: { label: 'General', icon: '🛡️' },
  pentester: { label: 'Pentester', icon: '🕷️' },
  soc: { label: 'SOC Analyst', icon: '👁️' },
  forensics: { label: 'Forensics', icon: '🔍' }
};

const Roadmap = () => {
  const { user } = useAuth();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [selectedCareer, setSelectedCareer] = useState('all');
  const [selectedPath, setSelectedPath] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(null);
  const [userXp, setUserXp] = useState(0);
  const [completedModules, setCompletedModules] = useState([]);
  const [myCerts, setMyCerts] = useState([]);

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    try {
      const [pathsRes, userRes] = await Promise.all([
        api.get('/paths'),
        api.get('/users/me')
      ]);
      setPaths(pathsRes.data);
      setUserXp(userRes.data.xp || 0);
      setCompletedModules(userRes.data.completedModules || []);
    } catch (err) {
      console.error('Paths load error:', err);
      toast.error('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
    // Load certs separately — never block paths from loading
    try {
      const certsRes = await api.get('/certificates/my');
      setMyCerts(certsRes.data || []);
    } catch {
      setMyCerts([]);
    }
  };

  const [quizModal, setQuizModal] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);

  const handleCompleteModule = async (pathId, moduleId, moduleName, module) => {
    if (module?.quiz?.length && !quizModal) {
      setQuizModal({ pathId, moduleId, moduleName, quiz: module.quiz });
      setQuizAnswers(module.quiz.map(() => 0));
      return;
    }
    setCompleting(true);
    try {
      const res = await api.post(`/paths/${pathId}/modules/${moduleId}/complete`, {
        answers: quizAnswers.length ? quizAnswers : undefined
      });
      toast.success(`✅ "${moduleName}" completed! +${res.data.xpEarned} XP`);
      if (res.data.badges?.length > 0) {
        const newBadge = res.data.badges[res.data.badges.length - 1];
        setTimeout(() => toast.success(`🏅 New badge: ${newBadge.name}!`), 1000);
      }
      if (res.data.pathCompleted && res.data.certificate) {
        setTimeout(() => toast.success(`🎓 Path complete! Certificate earned: ${res.data.certificate.pathTitle}`), 1500);
      }
      await fetchPaths();
      setQuizModal(null);
      setQuizAnswers([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete module');
    } finally {
      setCompleting(false);
    }
  };

  const submitQuiz = () => {
    if (!quizModal) return;
    handleCompleteModule(quizModal.pathId, quizModal.moduleId, quizModal.moduleName, null);
  };

  const handleDownloadCert = async (pathId, pathTitle) => {
    setDownloadingCert(pathId);
    try {
      // Look in already-loaded certs first
      let cert = myCerts.find(c =>
        (c.learningPath && c.learningPath.toString() === pathId.toString()) ||
        c.pathTitle === pathTitle
      );
      // If not cached, re-fetch
      if (!cert) {
        const freshRes = await api.get('/certificates/my');
        const freshCerts = freshRes.data || [];
        setMyCerts(freshCerts);
        cert = freshCerts.find(c =>
          (c.learningPath && c.learningPath.toString() === pathId.toString()) ||
          c.pathTitle === pathTitle
        );
      }
      // Still not found — try to claim it (handles paths completed before cert system)
      if (!cert) {
        try {
          const claimRes = await api.post(`/certificates/claim/${pathId}`);
          cert = claimRes.data;
          setMyCerts(prev => [cert, ...prev]);
        } catch (claimErr) {
          toast.error('Certificate not found. Make sure you completed all modules!');
          return;
        }
      }
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/certificates/${cert.certificateId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `CyberLab-${pathTitle.replace(/\s+/g, '-')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded!');
    } catch {
      toast.error('Failed to download certificate');
    } finally {
      setDownloadingCert(null);
    }
  };

  const filteredPaths = paths.filter(p => {
    if (selectedTrack !== 'all' && p.track !== selectedTrack) return false;
    if (selectedCareer !== 'all' && p.careerPath !== selectedCareer) return false;
    return true;
  });

  const totalXP = paths.reduce((sum, p) =>
    sum + p.modules.reduce((s, m) => s + m.xpReward, 0), 0);

  const earnedXP = userXp;

  if (loading) return <div className="loading">Loading roadmap...</div>;

  return (
    <div className="roadmap-page">
      <div className="roadmap-header">
        <div>
          <h1>🗺️ Learning Roadmap</h1>
          <p>Your path from beginner to professional ethical hacker</p>
        </div>
        <div className="roadmap-xp">
          <div className="xp-info">
            <span className="xp-label">Total XP</span>
            <span className="xp-value">⭐ {earnedXP} / {totalXP}</span>
          </div>
          <div className="xp-bar">
            <div
              className="xp-fill"
              style={{ width: `${totalXP > 0 ? (earnedXP / totalXP) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="track-tabs">
        {['all', 'beginner', 'intermediate', 'advanced'].map(track => (
          <button
            key={track}
            className={`track-tab ${selectedTrack === track ? 'active' : ''}`}
            onClick={() => setSelectedTrack(track)}
            style={selectedTrack === track && track !== 'all'
              ? { borderColor: trackInfo[track]?.color, color: trackInfo[track]?.color }
              : {}}
          >
            {track === 'all' ? '🌐 All' : `${trackInfo[track].icon} ${trackInfo[track].label}`}
          </button>
        ))}
      </div>

      <div className="career-tabs">
        {['all', 'general', 'pentester', 'soc', 'forensics'].map(career => (
          <button
            key={career}
            className={`career-tab ${selectedCareer === career ? 'active' : ''}`}
            onClick={() => setSelectedCareer(career)}
          >
            {career === 'all' ? 'All Paths' : `${careerInfo[career].icon} ${careerInfo[career].label}`}
          </button>
        ))}
      </div>

      <div className="paths-grid">
        {filteredPaths.map(path => {
          const isComplete = (path.progress || 0) >= 100;
          return (
            <div
              key={path._id}
              className={`path-card ${isComplete ? 'path-complete' : ''}`}
              style={{ borderTopColor: path.color }}
              onClick={() => setSelectedPath(path)}
            >
              <div className="path-card-header">
                <span className="path-icon">{path.icon}</span>
                <div className="path-badges">
                  <span
                    className="track-badge"
                    style={{ color: trackInfo[path.track]?.color }}
                  >
                    {trackInfo[path.track]?.icon} {trackInfo[path.track]?.label}
                  </span>
                  <span className="career-badge">
                    {careerInfo[path.careerPath]?.icon} {careerInfo[path.careerPath]?.label}
                  </span>
                  {isComplete && <span className="completed-path-badge">✅ Completed</span>}
                </div>
              </div>

              <h3>{path.title}</h3>
              <p>{path.description}</p>

              <div className="path-progress">
                <div className="path-progress-bar">
                  <div
                    className="path-progress-fill"
                    style={{
                      width: `${path.progress || 0}%`,
                      background: isComplete ? '#3fb950' : path.color
                    }}
                  />
                </div>
                <span className="path-progress-text">
                  {path.completedModules}/{path.totalModules} modules
                </span>
              </div>

              <div className="path-footer">
                <span className="path-xp">
                  ⭐ {path.modules.reduce((s, m) => s + m.xpReward, 0)} XP
                </span>
                <span className="path-modules">
                  📚 {path.totalModules} modules
                </span>
              </div>

              {isComplete && (
                <button
                  className="cert-download-btn"
                  onClick={e => { e.stopPropagation(); handleDownloadCert(path._id, path.title); }}
                  disabled={downloadingCert === path._id}
                >
                  {downloadingCert === path._id ? '⏳ Downloading...' : '📜 Download Certificate'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedPath && (
        <div className="modal-overlay" onClick={() => setSelectedPath(null)}>
          <div className="path-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPath(null)}>✕</button>

            <div className="modal-header" style={{ borderBottomColor: selectedPath.color }}>
              <span className="modal-icon">{selectedPath.icon}</span>
              <div>
                <h2>{selectedPath.title}</h2>
                <p>{selectedPath.description}</p>
              </div>
            </div>

            <div className="modal-progress">
              <div className="modal-progress-bar">
                <div
                  className="modal-progress-fill"
                  style={{
                    width: `${selectedPath.progress || 0}%`,
                    background: selectedPath.color
                  }}
                />
              </div>
              <span>{selectedPath.progress || 0}% complete</span>
            </div>

            <div className="modules-list">
              {selectedPath.modules
                .sort((a, b) => a.order - b.order)
                .map((module, index) => {
                  const isCompleted = completedModules.includes(module._id);
                  return (
                    <div
                      key={module._id}
                      className={`module-item ${isCompleted ? 'completed' : ''}`}
                    >
                      <div className="module-left">
                        <div
                          className="module-number"
                          style={{ background: isCompleted ? '#3fb950' : selectedPath.color }}
                        >
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <div className="module-info">
                          <h4>{module.icon} {module.title}</h4>
                          <p>{module.description}</p>
                          <div className="module-topics">
                            {module.topics.slice(0, 4).map((topic, i) => (
                              <span key={i} className="topic-tag">{topic}</span>
                            ))}
                            {module.topics.length > 4 && (
                              <span className="topic-tag">+{module.topics.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="module-right">
                        <span className="module-xp">⭐ {module.xpReward} XP</span>
                        {isCompleted ? (
                          <span className="completed-label">✅ Done</span>
                        ) : (
                          <button
                            className="complete-btn"
                            style={{ background: selectedPath.color }}
                            onClick={() => handleCompleteModule(
                              selectedPath._id,
                              module._id,
                              module.title,
                              module
                            )}
                            disabled={completing}
                          >
                            {completing ? '...' : 'Mark done'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {quizModal && (
        <div className="modal-overlay" onClick={() => setQuizModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>📝 Module Quiz — {quizModal.moduleName}</h2>
            {quizModal.quiz.map((q, qi) => (
              <div key={qi} className="quiz-question">
                <p>{qi + 1}. {q.question}</p>
                {q.options.map((opt, oi) => (
                  <label key={oi}>
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={quizAnswers[qi] === oi}
                      onChange={() => setQuizAnswers(prev => prev.map((a, i) => i === qi ? oi : a))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            <button className="complete-btn" onClick={submitQuiz} disabled={completing}>
              Submit Quiz & Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;