import React from 'react';

const formatDuration = (seconds) => {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const BarChart = ({ data, valueKey, labelKey, color = '#58a6ff', height = 140 }) => {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="analytics-chart" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="chart-bar-col" title={`${item[labelKey]}: ${item[valueKey]}`}>
          <div
            className="chart-bar"
            style={{
              height: `${(item[valueKey] / max) * 100}%`,
              background: color
            }}
          />
          <span className="chart-bar-label">
            {item.label || formatDate(item[labelKey])}
          </span>
        </div>
      ))}
    </div>
  );
};

const AdminAnalytics = ({ analytics, loading }) => {
  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!analytics) return <p className="analytics-empty">No analytics data available.</p>;

  const { overview, mostDifficultChallenge, mostSolvedChallenge, dailyActiveUsers, userGrowth, dauToday } = analytics;
  const difficultyColor = { easy: '#3fb950', medium: '#f0c040', hard: '#f85149' };

  return (
    <div className="admin-analytics">
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi">
          <span className="kpi-icon">👥</span>
          <div>
            <h3>Active Users (7d)</h3>
            <p className="kpi-value">{overview.activeUsers7d}</p>
            <span className="kpi-sub">{overview.activeUsers24h} in last 24h · {overview.totalUsers} total</span>
          </div>
        </div>

        <div className="analytics-kpi">
          <span className="kpi-icon">⏱️</span>
          <div>
            <h3>Avg Completion Time</h3>
            <p className="kpi-value">{formatDuration(overview.avgCompletionSeconds)}</p>
            <span className="kpi-sub">
              Based on {overview.labCompletionsSampled} completed lab{overview.labCompletionsSampled !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="analytics-kpi">
          <span className="kpi-icon">📈</span>
          <div>
            <h3>DAU Today</h3>
            <p className="kpi-value">{dauToday}</p>
            <span className="kpi-sub">Distinct users active today</span>
          </div>
        </div>
      </div>

      <div className="analytics-highlight-grid">
        <div className="analytics-highlight difficult">
          <h3>🔥 Most Difficult Challenge</h3>
          {mostDifficultChallenge ? (
            <>
              <p className="highlight-title">{mostDifficultChallenge.title}</p>
              <div className="highlight-meta">
                <span style={{ color: difficultyColor[mostDifficultChallenge.difficulty] }}>
                  {mostDifficultChallenge.difficulty}
                </span>
                <span>{mostDifficultChallenge.category}</span>
                <span>⚡ {mostDifficultChallenge.points} pts</span>
              </div>
              <p className="highlight-stat">
                {mostDifficultChallenge.solveCount} solves
                <span className="muted"> · {mostDifficultChallenge.solveRate}% solve rate</span>
              </p>
              <p className="highlight-note">Ranked by difficulty weight vs. solve rate</p>
            </>
          ) : (
            <p className="muted">No challenge data yet</p>
          )}
        </div>

        <div className="analytics-highlight popular">
          <h3>🏆 Most Solved Challenge</h3>
          {mostSolvedChallenge ? (
            <>
              <p className="highlight-title">{mostSolvedChallenge.title}</p>
              <div className="highlight-meta">
                <span style={{ color: difficultyColor[mostSolvedChallenge.difficulty] }}>
                  {mostSolvedChallenge.difficulty}
                </span>
                <span>{mostSolvedChallenge.category}</span>
                <span>⚡ {mostSolvedChallenge.points} pts</span>
              </div>
              <p className="highlight-stat">
                <strong>{mostSolvedChallenge.solveCount}</strong> total solves
              </p>
            </>
          ) : (
            <p className="muted">No solves recorded yet</p>
          )}
        </div>
      </div>

      <div className="analytics-charts-grid">
        <div className="analytics-chart-card">
          <h3>📊 Daily Active Users</h3>
          <p className="chart-desc">Distinct users per day (last 30 days)</p>
          <BarChart
            data={dailyActiveUsers}
            valueKey="count"
            labelKey="date"
            color="#3fb950"
            height={160}
          />
        </div>

        <div className="analytics-chart-card">
          <h3>📈 User Growth</h3>
          <p className="chart-desc">New registrations per week (last 12 weeks)</p>
          <BarChart
            data={userGrowth}
            valueKey="count"
            labelKey="week"
            color="#58a6ff"
            height={160}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
