import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { getRank } from '../../utils/rankUtils';
import { isChallengeSolved, getSolvedCount } from '../../utils/userUtils';
import SkillRadar from '../../components/SkillRadar/SkillRadar';
import ActivityFeed from '../../components/ActivityFeed/ActivityFeed';
import './Dashboard.css';

const SkeletonCard = () => (
  <div className="stat-card skeleton">
    <div className="sk-line sk-title" />
    <div className="sk-line sk-number" />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeStudyPlan, setActiveStudyPlan] = useState(null);

  useEffect(() => {
    api.get('/analytics/skills').then(r => setAnalytics(r.data)).catch(() => {});
    api.get('/study-plans').then(r => setActiveStudyPlan(r.data.activePlan)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([api.get('/challenges'), api.get('/labs')])
      .then(([cRes, lRes]) => {
        setChallenges(cRes.data);
        setLabs(lRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { key: 'web',      icon: '🌐', label: 'Web' },
    { key: 'network',  icon: '🔒', label: 'Network' },
    { key: 'linux',    icon: '🐧', label: 'Linux' },
    { key: 'forensics',icon: '🔍', label: 'Forensics' },
    { key: 'crypto',   icon: '🔐', label: 'Crypto' },
  ];

  const rank = getRank(user?.xp || 0);
  const solvedCount  = getSolvedCount(user?.solvedChallenges);
  const completedLabs = labs.filter(l => l.completed).length;
  const challengeProgress = challenges.length > 0 ? (solvedCount / challenges.length) * 100 : 0;
  const labProgress = labs.length > 0 ? (completedLabs / labs.length) * 100 : 0;

  // XP to next level
  const xpThresholds = [0, 200, 500, 1000, 2000, 4000];
  const lvl = user?.level || 1;
  const xpCurrent = user?.xp || 0;
  const xpForCurrent = xpThresholds[Math.min(lvl - 1, xpThresholds.length - 1)] || 0;
  const xpForNext    = xpThresholds[Math.min(lvl, xpThresholds.length - 1)] || xpForCurrent + 500;
  const xpProgress   = Math.min(((xpCurrent - xpForCurrent) / (xpForNext - xpForCurrent)) * 100, 100);

  // Next recommended: first uncompleted lab sorted by difficulty
  const diffOrder = { easy: 0, medium: 1, hard: 2 };
  const nextLab = [...labs]
    .filter(l => !l.completed)
    .sort((a, b) => (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0))[0];

  const nextChallenge = challenges
    .filter(c => !isChallengeSolved(user?.solvedChallenges, c._id))[0];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, <span>{user?.username}</span>! 👋</h1>
          <p>Ready to hack today?</p>
        </div>
        <div className="user-badge">
          <span className="level-badge">Level {user?.level}</span>
          <span className="rank-badge-dash" style={{ color: rank.color, borderColor: rank.color + '44', background: rank.color + '15' }}>
            {rank.icon} {rank.title}
          </span>
          <span className="points-badge">⚡ {user?.points} pts</span>
          {(user?.dailyStreak > 0) && (
            <span className="streak-badge">🔥 {user.dailyStreak}-day streak</span>
          )}
        </div>
      </div>

      <div className="stats-grid">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="stat-card">
              <h3>Challenges Solved</h3>
              <p className="stat-number">{solvedCount}</p>
              <span className="stat-sub">of {challenges.length} total</span>
            </div>
            <div className="stat-card">
              <h3>Labs Completed</h3>
              <p className="stat-number">{completedLabs}</p>
              <span className="stat-sub">of {labs.length} total</span>
            </div>
            <div className="stat-card">
              <h3>Total Points</h3>
              <p className="stat-number">{user?.points}</p>
              <span className="stat-sub">⚡ {user?.xp || 0} XP</span>
            </div>
            <div className="stat-card">
              <h3>Current Level</h3>
              <p className="stat-number">{user?.level}</p>
              <span className="stat-sub">{Math.round(xpProgress)}% to next</span>
            </div>
          </>
        )}
      </div>

      <div className="progress-section">
        <div className="progress-row">
          <div className="progress-block">
            <div className="progress-label">
              <span>Challenges</span>
              <span>{solvedCount}/{challenges.length} ({Math.round(challengeProgress)}%)</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${challengeProgress}%` }} />
            </div>
          </div>
          <div className="progress-block">
            <div className="progress-label">
              <span>Labs</span>
              <span>{completedLabs}/{labs.length} ({Math.round(labProgress)}%)</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill labs-fill" style={{ width: `${labProgress}%` }} />
            </div>
          </div>
          <div className="progress-block">
            <div className="progress-label">
              <span>XP to Level {(user?.level || 1) + 1}</span>
              <span>{xpCurrent}/{xpForNext} XP</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill xp-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {!user?.emailVerified && (
        <div className="email-banner">
          ⚠️ Verify your email to submit flags and access labs.
          <Link to="/profile">Go to Profile →</Link>
        </div>
      )}

      {activeStudyPlan && (
        <div className="study-plan-dash-card">
          <div>
            <span className="study-plan-dash-label">📅 Active study plan</span>
            <h3>{activeStudyPlan.icon} {activeStudyPlan.title}</h3>
            <p>{activeStudyPlan.completedTopics}/{activeStudyPlan.totalTopics} topics · {activeStudyPlan.progress}% complete</p>
            <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
              <div className="progress-fill" style={{ width: `${activeStudyPlan.progress}%` }} />
            </div>
          </div>
          <Link to={`/study-plans/${activeStudyPlan.slug}`} className="study-plan-dash-link">
            Continue plan →
          </Link>
        </div>
      )}

      {!activeStudyPlan && (
        <div className="study-plan-dash-card study-plan-dash-card--cta">
          <div>
            <span className="study-plan-dash-label">📅 Study Plans</span>
            <h3>Follow a structured career path</h3>
            <p>30-Day Pentester, SOC Analyst, or Forensics — week-by-week topics with linked labs.</p>
          </div>
          <Link to="/study-plans" className="study-plan-dash-link">Browse plans →</Link>
        </div>
      )}

      <div className="dashboard-insights">
        <SkillRadar radar={analytics?.radar} weakAreas={analytics?.weakAreas} />
        <ActivityFeed />
      </div>

      {(nextLab || nextChallenge) && (
        <div className="next-section">
          <h2>Continue Learning</h2>
          <div className="next-cards">
            {nextLab && (
              <div className="next-card" onClick={() => navigate('/labs')}>
                <div className="next-card-tag">Recommended Lab</div>
                <h3>{nextLab.title}</h3>
                <p>{nextLab.description?.slice(0, 90)}...</p>
                <div className="next-card-footer">
                  <span className={`diff-badge diff-${nextLab.difficulty}`}>{nextLab.difficulty}</span>
                  <span className="next-card-pts">⚡ {nextLab.points} pts</span>
                  <span className="next-card-cta">Start Lab →</span>
                </div>
              </div>
            )}
            {nextChallenge && (
              <div className="next-card" onClick={() => navigate('/challenges')}>
                <div className="next-card-tag">Recommended Challenge</div>
                <h3>{nextChallenge.title}</h3>
                <p>{nextChallenge.description?.slice(0, 90)}...</p>
                <div className="next-card-footer">
                  <span className={`diff-badge diff-${nextChallenge.difficulty}`}>{nextChallenge.difficulty}</span>
                  <span className="next-card-pts">⚡ {nextChallenge.points} pts</span>
                  <span className="next-card-cta">Solve →</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="categories-section">
        <h2>Learning Tracks</h2>
        <div className="categories-grid">
          {categories.map(({ key, icon, label }) => {
            const catChallenges = challenges.filter(c => c.category === key);
            const catLabs = labs.filter(l => l.category === key);
            const solved = catChallenges.filter(c => isChallengeSolved(user?.solvedChallenges, c._id)).length;
            return (
              <Link to={`/challenges?category=${key}`} key={key} className="category-card">
                <span className="cat-icon">{icon}</span>
                <h3>{label}</h3>
                <p>{catChallenges.length} challenges · {catLabs.length} labs</p>
                {catChallenges.length > 0 && (
                  <div className="cat-progress-bar">
                    <div className="cat-progress-fill" style={{ width: `${(solved/catChallenges.length)*100}%` }} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {user?.badges?.length > 0 && (
        <div className="badges-section">
          <h2>Your Badges</h2>
          <div className="badges-grid">
            {user.badges.map((badge, i) => (
              <div key={i} className="badge-card">
                <span>🏆</span>
                <h4>{badge.name}</h4>
                <p>{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
