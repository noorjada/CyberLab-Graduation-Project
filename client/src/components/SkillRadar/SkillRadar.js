import React from 'react';
import './SkillRadar.css';

const icons = { web: '🌐', network: '🔒', linux: '🐧', forensics: '🔍', crypto: '🔐' };

const SkillRadar = ({ radar = [], weakAreas = [] }) => {
  if (!radar.length) return null;

  return (
    <div className="skill-radar">
      <h3>📊 Skill Radar</h3>
      <div className="radar-grid">
        {radar.map(r => (
          <div key={r.category} className="radar-item">
            <div className="radar-label">
              <span>{icons[r.category] || '📌'} {r.category}</span>
              <span>{r.solved}/{r.total}</span>
            </div>
            <div className="radar-bar">
              <div className="radar-fill" style={{ width: `${r.percent}%` }} />
            </div>
            <span className="radar-pct">{r.percent}%</span>
          </div>
        ))}
      </div>
      {weakAreas.length > 0 && (
        <p className="weak-areas">⚠️ Focus areas: <strong>{weakAreas.join(', ')}</strong></p>
      )}
    </div>
  );
};

export default SkillRadar;
