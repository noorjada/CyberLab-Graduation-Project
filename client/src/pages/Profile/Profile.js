import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { getRank, getNextRank } from '../../utils/rankUtils';
import './Profile.css';

const categoryIcons = { web: '🌐', network: '🔒', linux: '🐧', forensics: '🔍', crypto: '🔐' };
const careerLabels  = { pentester: '⚔️ Pentester', soc: '🛡️ SOC Analyst', forensics: '🔍 Forensics', general: '🎯 General' };
const trackLabels   = { beginner: '🌱 Beginner', intermediate: '⚡ Intermediate', advanced: '🔥 Advanced' };

const xpThresholds = [0, 200, 500, 1000, 2000, 4000];

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    api.get('/bookmarks').then(r => setBookmarks(r.data)).catch(() => {});
    api.get('/users/me')
      .then(res => setProfile(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error('Passwords do not match');
    if (passwordData.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      toast.success('Password changed successfully!');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return (
    <div className="profile-page">
      <div className="profile-skeleton">
        <div className="sk-avatar" />
        <div className="sk-lines">
          <div className="sk-line sk-name" /><div className="sk-line sk-email" />
        </div>
      </div>
    </div>
  );

  const lvl = profile?.level || 1;
  const xp  = profile?.xp || 0;
  const xpForCurrent = xpThresholds[Math.min(lvl - 1, xpThresholds.length - 1)] || 0;
  const xpForNext    = xpThresholds[Math.min(lvl, xpThresholds.length - 1)] || xpForCurrent + 500;
  const xpPercent    = Math.min(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100, 100);
  const rank     = getRank(xp);
  const nextRank = getNextRank(xp);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  const avatarColor = ['#1f6feb','#238636','#9a3412','#6e40c9','#b45309'][
    (profile?.username?.charCodeAt(0) || 0) % 5
  ];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar" style={{ background: avatarColor }}>
          {profile?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h1>{profile?.username}</h1>
          <p className="profile-email">{profile?.email}</p>
          <div className="profile-meta">
            {memberSince && <span className="meta-tag">📅 Since {memberSince}</span>}
            {careerLabels[profile?.careerPath] && <span className="meta-tag">{careerLabels[profile.careerPath]}</span>}
            {trackLabels[profile?.currentTrack] && <span className="meta-tag">{trackLabels[profile.currentTrack]}</span>}
            {profile?.dailyStreak > 0 && <span className="meta-tag streak-tag">🔥 {profile.dailyStreak}-day streak</span>}
          </div>
          <div className="profile-badges-row">
            <span className="level-badge">Level {profile?.level}</span>
            <span className="rank-badge" style={{ color: rank.color, borderColor: rank.color + '44', background: rank.color + '15' }}>
              {rank.icon} {rank.title}
            </span>
            <span className="points-badge">⚡ {profile?.points} pts</span>
            <span className="xp-badge">🧠 {profile?.xp || 0} XP</span>
            <span className="solves-badge">✅ {profile?.solvedChallenges?.length || 0} solves</span>
          </div>
          {nextRank && (
            <div className="rank-progress-row">
              <span className="rank-progress-label">Next rank: {nextRank.icon} {nextRank.title}</span>
              <div className="rank-progress-bar">
                <div className="rank-progress-fill" style={{ width: `${Math.min(((xp - rank.min) / (nextRank.min - rank.min)) * 100, 100)}%`, background: nextRank.color }} />
              </div>
              <span className="rank-progress-xp">{nextRank.min - xp} XP to go</span>
            </div>
          )}
        </div>
      </div>

      <div className="level-progress">
        <div className="level-progress-header">
          <span>Level {lvl} → Level {lvl + 1}</span>
          <span>{xp} / {xpForNext} XP ({Math.round(xpPercent)}%)</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${xpPercent}%` }} />
        </div>
        <p className="xp-hint">{xpForNext - xp} XP needed to reach Level {lvl + 1}</p>
      </div>

      <div className="profile-stats-grid">
        <div className="pstat-card">
          <div className="pstat-icon">⚡</div>
          <div className="pstat-val">{profile?.points || 0}</div>
          <div className="pstat-label">Points</div>
        </div>
        <div className="pstat-card">
          <div className="pstat-icon">🧠</div>
          <div className="pstat-val">{profile?.xp || 0}</div>
          <div className="pstat-label">XP</div>
        </div>
        <div className="pstat-card">
          <div className="pstat-icon">✅</div>
          <div className="pstat-val">{profile?.solvedChallenges?.length || 0}</div>
          <div className="pstat-label">Solves</div>
        </div>
        <div className="pstat-card">
          <div className="pstat-icon">🔥</div>
          <div className="pstat-val">{profile?.dailyStreak || 0}</div>
          <div className="pstat-label">Day Streak</div>
        </div>
        <div className="pstat-card">
          <div className="pstat-icon">🏅</div>
          <div className="pstat-val">{profile?.badges?.length || 0}</div>
          <div className="pstat-label">Badges</div>
        </div>
        <div className="pstat-card">
          <div className="pstat-icon">🖥️</div>
          <div className="pstat-val">{profile?.completedLabs || 0}</div>
          <div className="pstat-label">Labs Done</div>
        </div>
        <div className="pstat-card">
          <div className="pstat-icon">📜</div>
          <div className="pstat-val">{profile?.completedPaths || 0}</div>
          <div className="pstat-label">Certifications</div>
        </div>
      </div>

      {profile?.badges?.length > 0 && (
        <div className="profile-section">
          <h2>🏆 Badges</h2>
          <div className="badges-grid">
            {profile.badges.map((badge, i) => (
              <div key={i} className="badge-card">
                <span>🏅</span>
                <h4>{badge.name}</h4>
                <p>{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile?.achievements?.length > 0 && (
        <div className="profile-section">
          <h2>🎖️ Achievements</h2>
          <div className="achievements-grid">
            {profile.achievements.map((ach, i) => (
              <div key={i} className="achievement-card unlocked">
                <div className="ach-icon">{ach.icon || '🏅'}</div>
                <div className="ach-info">
                  <div className="ach-name">{ach.name}</div>
                  <div className="ach-desc">{ach.description}</div>
                  <div className="ach-date">{new Date(ach.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(profile?.completedPaths || 0) > 0 && (
        <div className="profile-section cert-cta-section">
          <div className="cert-cta">
            <div className="cert-cta-left">
              <span className="cert-cta-icon">📜</span>
              <div>
                <div className="cert-cta-title">You have {profile.completedPaths} certificate{profile.completedPaths !== 1 ? 's' : ''}</div>
                <div className="cert-cta-sub">Download and share your learning achievements</div>
              </div>
            </div>
            <Link to="/certificates" className="cert-cta-btn">View Certificates →</Link>
          </div>
        </div>
      )}

      {profile?.solvedChallenges?.length > 0 && (
        <div className="profile-section">
          <h2>✅ Solved Challenges</h2>
          <div className="solved-list">
            {profile.solvedChallenges.map((challenge) => (
              <div key={challenge._id} className="solved-item">
                <span className="solved-icon">{categoryIcons[challenge.category] || '🎯'}</span>
                <span className="solved-title">{challenge.title}</span>
                <span className={`solved-diff diff-${challenge.difficulty}`}>{challenge.difficulty}</span>
                <span className="solved-pts">⚡ {challenge.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="profile-section">
        <div className="section-header">
          <h2>🔐 Security</h2>
          <button className="toggle-btn" onClick={() => setShowChangePassword(!showChangePassword)}>
            {showChangePassword ? 'Cancel' : 'Change Password'}
          </button>
        </div>
        {bookmarks.length > 0 && (
          <div className="bookmarks-section">
            <h3>🔖 Bookmarks</h3>
            {bookmarks.map(b => (
              <div key={`${b.itemType}-${b.itemId}`} className="bookmark-item">
                <span>{b.itemType === 'challenge' ? '🚩' : b.itemType === 'lab' ? '🖥️' : '🗺️'}</span>
                <span>{b.item?.title || 'Item'}</span>
                <button onClick={async () => {
                  await api.delete(`/bookmarks/${b.itemType}/${b.itemId}`);
                  setBookmarks(prev => prev.filter(x => x.itemId !== b.itemId));
                }}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <div className="profile-settings">
          <label>
            <input
              type="checkbox"
              checked={profile?.digestEnabled !== false}
              onChange={async e => {
                await api.put('/users/me', { digestEnabled: e.target.checked });
                setProfile(p => ({ ...p, digestEnabled: e.target.checked }));
              }}
            />
            Weekly email digest
          </label>
        </div>

        {profile?.lastLogin && (
          <p className="last-login">Last login: {new Date(profile.lastLogin).toLocaleString()}</p>
        )}
        {showChangePassword && (
          <form onSubmit={handleChangePassword} className="change-password-form">
            {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
              <div key={field} className="form-group">
                <label>{['Current Password', 'New Password', 'Confirm New Password'][i]}</label>
                <input
                  type="password"
                  value={passwordData[field]}
                  onChange={e => setPasswordData({ ...passwordData, [field]: e.target.value })}
                  placeholder={['Enter current password', 'Enter new password', 'Confirm new password'][i]}
                  required
                />
              </div>
            ))}
            <button type="submit" className="change-pwd-btn" disabled={changingPassword}>
              {changingPassword ? 'Changing...' : '🔐 Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
