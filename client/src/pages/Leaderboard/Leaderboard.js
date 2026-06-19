import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { getRank } from '../../utils/rankUtils';
import './Leaderboard.css';

const Skeleton = () => (
  <div className="lb-skeleton">
    {[1,2,3,4,5].map(i => (
      <div key={i} className="lb-sk-row">
        <div className="sk-line sk-rank" />
        <div className="sk-line sk-name" />
        <div className="sk-line sk-pts" />
      </div>
    ))}
  </div>
);

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentRowRef = useRef(null);

  useEffect(() => {
    api.get('/users/leaderboard')
      .then(res => setLeaders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && currentRowRef.current) {
      setTimeout(() => {
        currentRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [loading]);

  const myRank = leaders.findIndex(l => l.username === user?.username) + 1;
  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumClass = ['silver', 'gold', 'bronze'];
  const podiumHeight = ['160px', '200px', '130px'];
  const podiumLabel = ['🥈 2nd', '🥇 1st', '🥉 3rd'];

  if (loading) return (
    <div className="leaderboard-page">
      <h1>🏆 Leaderboard</h1>
      <Skeleton />
    </div>
  );

  return (
    <div className="leaderboard-page">
      <div className="lb-header">
        <div>
          <h1>🏆 Leaderboard</h1>
          <p className="subtitle">Top hackers on CyberLab — {leaders.length} ranked</p>
        </div>
        {myRank > 0 && (
          <div className="my-rank-badge">
            Your rank: <strong>#{myRank}</strong>
          </div>
        )}
      </div>

      {top3.length >= 3 && (
        <div className="podium">
          {podiumOrder.map((leader, i) => leader && (
            <div key={leader._id} className={`podium-slot ${podiumClass[i]}`}>
              <div className="podium-avatar">{leader.username.charAt(0).toUpperCase()}</div>
              <div className="podium-name">
                {leader.username}
                {leader.username === user?.username && <span className="you-dot"> ●</span>}
              </div>
              <div className="podium-pts">⚡ {leader.points}</div>
              <div className="podium-block" style={{ height: podiumHeight[i] }}>
                <span className="podium-rank-label">{podiumLabel[i]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="leaderboard-table">
        <div className="table-header">
          <span>Rank</span>
          <span>Hacker</span>
          <span>Title</span>
          <span>Solves</span>
          <span>Points</span>
        </div>
        {rest.map((leader, index) => {
          const isMe = leader.username === user?.username;
          const lRank = getRank(leader.xp || 0);
          return (
            <div
              key={leader._id}
              ref={isMe ? currentRowRef : null}
              className={`table-row ${isMe ? 'current-user' : ''}`}
            >
              <span className="rank">#{index + 4}</span>
              <span className="username">
                <span className="username-avatar">{leader.username.charAt(0).toUpperCase()}</span>
                {leader.username}
                {isMe && <span className="you-badge">you</span>}
              </span>
              <span className="lb-rank-title" style={{ color: lRank.color }}>{lRank.icon} {lRank.title}</span>
              <span className="solves-count">✅ {leader.solvedChallenges?.length || 0}</span>
              <span className="points">⚡ {leader.points}</span>
            </div>
          );
        })}

        {leaders.length === 0 && (
          <div className="lb-empty">No hackers yet — be the first!</div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
