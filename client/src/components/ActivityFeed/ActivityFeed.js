import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './ActivityFeed.css';

const ActivityFeed = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/activity').then(r => setItems(r.data)).catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <div className="activity-feed">
      <h3>📡 Live Activity</h3>
      <div className="activity-list">
        {items.slice(0, 8).map(a => (
          <div key={a._id} className="activity-item">
            <span>{a.icon}</span>
            <div>
              <strong>{a.username}</strong> {a.message}
              {a.link && <Link to={a.link}> →</Link>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
