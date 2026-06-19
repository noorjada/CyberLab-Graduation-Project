import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Daily.css';

const Daily = () => {
  const { user, refreshUser } = useAuth();
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categoryIcons = {
    web: '🌐', network: '🔒', linux: '🐧', forensics: '🔍'
  };

  const difficultyColor = {
    easy: '#3fb950', medium: '#f0c040', hard: '#f85149'
  };

  useEffect(() => {
    fetchDaily();
  }, []);

  const fetchDaily = async () => {
    try {
      const res = await api.get('/daily');
      setDaily(res.data);
    } catch (err) {
      toast.error('Failed to load daily challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/daily/submit', { flag });
      await refreshUser();
      toast.success(`🎉 ${res.data.message} +${res.data.bonusXP} XP`);
      if (res.data.streak >= 3) {
        setTimeout(() => toast.success(`🔥 ${res.data.streak} day streak!`), 1000);
      }
      setFlag('');
      fetchDaily();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (loading) return <div className="loading">Loading daily challenge...</div>;

  return (
    <div className="daily-page">
      <div className="daily-header">
        <div>
          <h1>🔥 Daily Challenge</h1>
          <p>A new challenge every day — keep your streak alive!</p>
        </div>
        <div className="streak-card">
          <div className="streak-number">{daily?.streak || 0}</div>
          <div className="streak-label">🔥 Day Streak</div>
          <div className="streak-timer">Resets in {getTimeUntilMidnight()}</div>
        </div>
      </div>

      <div className="streak-info">
        <div className="streak-milestone">
          <span className={daily?.streak >= 3 ? 'achieved' : ''}>🔥 3 days</span>
          <span className={daily?.streak >= 7 ? 'achieved' : ''}>⚡ 7 days</span>
          <span className={daily?.streak >= 30 ? 'achieved' : ''}>👑 30 days</span>
        </div>
        <p className="bonus-info">Bonus XP = 50 + (streak × 10)</p>
      </div>

      {daily?.challenge && (
        <div className="daily-challenge-card">
          <div className="daily-badge">TODAY'S CHALLENGE</div>

          <div className="daily-challenge-header">
            <span className="daily-icon">
              {categoryIcons[daily.challenge.category]}
            </span>
            <div>
              <h2>{daily.challenge.title}</h2>
              <div className="daily-meta">
                <span style={{ color: difficultyColor[daily.challenge.difficulty] }}>
                  {daily.challenge.difficulty}
                </span>
                <span>⚡ {daily.challenge.points} pts</span>
                <span className="bonus-xp">+{daily.bonusXP} bonus XP</span>
              </div>
            </div>
          </div>

          <p className="daily-description">{daily.challenge.description}</p>

          {daily.challenge.hints?.length > 0 && (
            <div className="daily-hints">
              <h4>💡 Hints</h4>
              {daily.challenge.hints.map((hint, i) => (
                <p key={i}>• {hint}</p>
              ))}
            </div>
          )}

          {daily.alreadySolvedToday ? (
            <div className="daily-solved">
              ✅ You solved today's challenge!
              <p>Come back tomorrow for a new one.</p>
              <div className="next-challenge">
                ⏰ Next challenge in {getTimeUntilMidnight()}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="daily-form">
              <input
                type="text"
                value={flag}
                onChange={e => setFlag(e.target.value)}
                placeholder="Enter flag: FLAG{...}"
                required
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : '🚩 Submit Flag'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="streak-history">
        <h3>How streaks work</h3>
        <div className="streak-steps">
          <div className="streak-step">
            <span>1️⃣</span>
            <p>Solve today's challenge</p>
          </div>
          <div className="streak-step">
            <span>2️⃣</span>
            <p>Come back tomorrow</p>
          </div>
          <div className="streak-step">
            <span>3️⃣</span>
            <p>Earn bonus XP + badges</p>
          </div>
          <div className="streak-step">
            <span>🔥</span>
            <p>Keep the streak alive!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Daily;