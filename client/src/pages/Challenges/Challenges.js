import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { isChallengeSolved } from '../../utils/userUtils';
import './Challenges.css';
import AIHint from '../../components/AIHint';
import LearningNotesPanel from '../../components/LearningNotes/LearningNotesPanel';
import WriteupSubmitPanel from '../../components/WriteupSubmitPanel/WriteupSubmitPanel';
import TheoryLessonPanel from '../../components/TheoryLesson/TheoryLessonPanel';
import LearningObjectives from '../../components/LearningObjectives/LearningObjectives';


const Challenges = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('category') || 'all';
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [writeup, setWriteup] = useState(null);
  const [loadingWriteup, setLoadingWriteup] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [revealedHints, setRevealedHints] = useState({});
  const [userRating, setUserRating] = useState(0);
  const [theoryReady, setTheoryReady] = useState(false);


  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await api.get('/challenges');
        setChallenges(res.data);
      } catch (err) {
        toast.error('Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category) setSelectedCategory(category);
  }, [location.search]);

  useEffect(() => {
    if (!challenges.length) return;
    const params = new URLSearchParams(location.search);
    const open = params.get('open');
    if (!open) return;
    const decoded = decodeURIComponent(open);
    const match = challenges.find(
      (c) => c.title.toLowerCase() === decoded.toLowerCase() || c._id === open
    );
    if (match) setSelectedChallenge(match);
  }, [challenges, location.search]);

  useEffect(() => {
    if (!selectedChallenge) return;
    setTheoryReady(false);
    setRevealedHints({});
    api.get(`/ratings/challenge/${selectedChallenge._id}`)
      .then(r => setUserRating(r.data.userScore || 0))
      .catch(() => {});
  }, [selectedChallenge]);

  const revealHint = async (index) => {
    try {
      const res = await api.post(`/challenges/${selectedChallenge._id}/hint/${index}`);
      setRevealedHints(prev => ({ ...prev, [index]: res.data.hint }));
      if (res.data.costPaid > 0) {
        toast.info(`-${res.data.costPaid} points for hint`);
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reveal hint');
    }
  };

  const rateChallenge = async (score) => {
    try {
      await api.post('/ratings', { itemType: 'challenge', itemId: selectedChallenge._id, score });
      setUserRating(score);
      toast.success('Rating saved!');
    } catch {
      toast.error('Failed to rate');
    }
  };

  const downloadFile = async (file) => {
    try {
      const res = await api.get(
        `/challenges/${selectedChallenge._id}/files/${file._id}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const toggleBookmark = async () => {
    try {
      await api.post('/bookmarks', { itemType: 'challenge', itemId: selectedChallenge._id });
      toast.success('Bookmarked!');
    } catch {
      toast.error('Already bookmarked or failed');
    }
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/challenges/${selectedChallenge._id}/submit`, { flag });
      toast.success(`🎉 ${res.data.message} +${res.data.pointsEarned} pts`);
      setFlag('');

     /* const savedUser = JSON.parse(localStorage.getItem('user'));
      savedUser.points = res.data.totalPoints;
      savedUser.level = res.data.level;
      localStorage.setItem('user', JSON.stringify(savedUser));
      window.location.reload();*/

      await refreshUser();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchWriteup = async (challengeId) => {
    setLoadingWriteup(true);
    try {
      const res = await api.get(`/challenges/${challengeId}/writeup`);
      setWriteup(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load writeup');
    } finally {
      setLoadingWriteup(false);
    }
  };

  const filteredChallenges = challenges.filter(c => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const difficultyColor = {
    easy: '#3fb950',
    medium: '#f0c040',
    hard: '#f85149'
  };

  const categoryIcons = {
    web: '🌐',
    network: '🔒',
    linux: '🐧',
    forensics: '🔍'
  };

  if (loading) return <div className="loading">Loading challenges...</div>;

  return (
    <div className="challenges-page">
      <h1>Challenges</h1>

      <div className="filters">
        <div className="filter-group">
          <label>Category</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="web">Web Security</option>
            <option value="network">Network Security</option>
            <option value="linux">Linux</option>
            <option value="forensics">Forensics</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Difficulty</label>
          <select value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)}>
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="no-challenges">
          <p>No challenges found. Check back soon!</p>
        </div>
      ) : (
        <div className="challenges-grid">
          {filteredChallenges.map(challenge => {
            const isSolved = isChallengeSolved(user?.solvedChallenges, challenge._id);
            return (
              <div
                key={challenge._id}
                className={`challenge-card ${isSolved ? 'solved' : ''}`}
                onClick={() => setSelectedChallenge(challenge)}
              >
                <div className="challenge-header">
                  <span className="challenge-icon">{categoryIcons[challenge.category]}</span>
                  {isSolved && <span className="solved-badge">✅ Solved</span>}
                </div>
                <h3>{challenge.title}</h3>
                <LearningObjectives
                  objectives={challenge.learningObjectives}
                  compact
                  maxItems={2}
                />
                <p>{challenge.description.substring(0, 80)}...</p>
                <div className="challenge-footer">
                  <span
                    className="difficulty-badge"
                    style={{ color: difficultyColor[challenge.difficulty] }}
                  >
                    {challenge.difficulty}
                  </span>
                  <span className="points-badge">⚡ {challenge.points} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedChallenge && (
        <div className="modal-overlay" onClick={() => setSelectedChallenge(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedChallenge(null)}>✕</button>
            <div className="modal-header">
              <span>{categoryIcons[selectedChallenge.category]}</span>
              <h2>{selectedChallenge.title}</h2>
            </div>
            <div className="modal-body">
              <LearningObjectives objectives={selectedChallenge.learningObjectives} />
              <TheoryLessonPanel
                lesson={selectedChallenge.theoryLesson}
                itemType="challenge"
                itemId={selectedChallenge._id}
                itemTitle={selectedChallenge.title}
                itemCategory={selectedChallenge.category}
                points={selectedChallenge.points}
                isCompleted={isChallengeSolved(user?.solvedChallenges, selectedChallenge._id)}
                onAcknowledge={() => setTheoryReady(true)}
              />
              <div className={
                theoryReady || !selectedChallenge.theoryLesson?.enabled
                  ? 'theory-gated unlocked'
                  : 'theory-gated'
              }
              title={!theoryReady ? 'Complete lesson, videos, and quiz first' : ''}
              >
              <p className="modal-description">{selectedChallenge.description}</p>
              <div className="modal-meta">
                <span style={{ color: difficultyColor[selectedChallenge.difficulty] }}>
                  {selectedChallenge.difficulty}
                </span>
                <span>⚡ {selectedChallenge.points} pts</span>
                <span>👥 {selectedChallenge.solvedBy?.length || 0} solves</span>
              </div>
              {selectedChallenge.mitreTags?.length > 0 && (
                <div className="mitre-tags">
                  {selectedChallenge.mitreTags.map(t => <span key={t} className="mitre-tag">{t}</span>)}
                </div>
              )}
              {selectedChallenge.files?.length > 0 && (
                <div className="challenge-files">
                  <h4>📎 Challenge Files</h4>
                  {selectedChallenge.files.map(file => (
                    <button
                      key={file._id}
                      type="button"
                      className="file-download-btn"
                      onClick={() => downloadFile(file)}
                    >
                      ⬇️ {file.originalName}
                      <span className="file-size">
                        ({file.size < 1024 * 1024
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`})
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedChallenge.hints?.length > 0 && (
                <div className="hints">
                  <h4>💡 Hints (first free, then costs points)</h4>
                  {selectedChallenge.hints.map((_, i) => (
                    <div key={i} className="hint-row">
                      {revealedHints[i] ? (
                        <p>• {revealedHints[i]}</p>
                      ) : (
                        <button type="button" className="hint-reveal-btn" onClick={() => revealHint(i)}>
                          Reveal hint {i + 1} {i === 0 ? '(free)' : `(${selectedChallenge.hintCosts?.[i] ?? 25} pts)`}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <LearningNotesPanel
                linkType="challenge"
                linkId={selectedChallenge._id}
                linkTitle={selectedChallenge.title}
                compact
              />

              <div className="challenge-actions-row">
                <button type="button" className="bookmark-btn" onClick={toggleBookmark}>🔖 Bookmark</button>
                <div className="rating-stars">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" className={userRating >= s ? 'active' : ''} onClick={() => rateChallenge(s)}>★</button>
                  ))}
                </div>
              </div>
              <button
                className="ai-hint-btn"
                onClick={() => setShowAI(true)}
              >
                🤖 Ask CyberBot for help
              </button>
              {!isChallengeSolved(user?.solvedChallenges, selectedChallenge._id) ? (
                <form onSubmit={handleSubmitFlag} className="flag-form">
                  <input
                    type="text"
                    value={flag}
                    onChange={e => setFlag(e.target.value)}
                    placeholder="Enter flag: FLAG{...}"
                    required
                  />
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Flag'}
                  </button>
                </form>
              ) : (
                <div className="already-solved">
                  ✅ You already solved this challenge!
                  <button
                    className="writeup-btn"
                    onClick={() => fetchWriteup(selectedChallenge._id)}
                    disabled={loadingWriteup}
                  >
                    {loadingWriteup ? 'Loading...' : '📖 View Official Writeup'}
                  </button>
                  <WriteupSubmitPanel challengeId={selectedChallenge._id} />
                </div>
              )}
              <button className="modal-close-btn" onClick={() => setSelectedChallenge(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {writeup && (
        <div className="modal-overlay" onClick={() => setWriteup(null)}>
          <div className="modal writeup-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setWriteup(null)}>✕</button>
            <h2>📖 Writeup</h2>
            <p className="writeup-author">By {writeup.author}</p>
            <div className="writeup-content">
              <p>{writeup.content}</p>
            </div>
            {writeup.tools?.length > 0 && (
              <div className="writeup-section">
                <h4>🛠️ Tools Used</h4>
                <div className="writeup-tools">
                  {writeup.tools.map((tool, i) => (
                    <span key={i} className="tool-tag">{tool}</span>
                  ))}
                </div>
              </div>
            )}
            {writeup.steps?.length > 0 && (
              <div className="writeup-section">
                <h4>📋 Step by Step</h4>
                <ol className="writeup-steps">
                  {writeup.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
      {showAI && selectedChallenge && (
        <AIHint
          challenge={selectedChallenge}
          isOpen={showAI}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
};

export default Challenges;