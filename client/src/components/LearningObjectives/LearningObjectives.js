import React from 'react';
import './LearningObjectives.css';

const LearningObjectives = ({ objectives = [], compact = false, maxItems }) => {
  if (!objectives?.length) return null;

  const items = maxItems ? objectives.slice(0, maxItems) : objectives;
  const remaining = maxItems && objectives.length > maxItems
    ? objectives.length - maxItems
    : 0;

  return (
    <section
      className={`learning-objectives ${compact ? 'learning-objectives--compact' : ''}`}
      aria-label="Learning objectives"
    >
      <h4 className="learning-objectives-title">Learning Objectives</h4>
      <ul className="learning-objectives-list">
        {items.map((objective, i) => (
          <li key={i} className="learning-objectives-item">
            <span className="learning-objectives-check" aria-hidden="true">✓</span>
            <span>{objective}</span>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <p className="learning-objectives-more">+{remaining} more objective{remaining !== 1 ? 's' : ''}</p>
      )}
    </section>
  );
};

export default LearningObjectives;
