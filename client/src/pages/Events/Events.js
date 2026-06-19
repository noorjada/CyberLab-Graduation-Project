import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/events').then(r => setEvents(r.data)).catch(() => {});
  }, []);

  const join = async (id) => {
    try {
      await api.post(`/events/${id}/join`);
      toast.success('Joined event!');
      const r = await api.get('/events');
      setEvents(r.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const loadBoard = async (id) => {
    setSelected(id);
    const r = await api.get(`/events/${id}/leaderboard`);
    setBoard(r.data);
  };

  const statusColor = { live: '#3fb950', upcoming: '#f0c040', ended: '#8b949e' };

  return (
    <div className="events-page">
      <h1>🏁 CTF Events</h1>
      <p>Timed competitions with live scoreboards</p>
      <div className="events-grid">
        {events.map(e => (
          <div key={e._id} className="event-card">
            <span className="event-status" style={{ color: statusColor[e.status] }}>{e.status?.toUpperCase()}</span>
            <h3>{e.title}</h3>
            <p>{e.description}</p>
            <p className="event-dates">
              {new Date(e.startAt).toLocaleDateString()} — {new Date(e.endAt).toLocaleDateString()}
            </p>
            <p>🚩 {e.challenges?.length || 0} challenges · 🖥️ {e.labs?.length || 0} labs</p>
            <div className="event-actions">
              {e.status === 'live' && <button onClick={() => join(e._id)}>Join Event</button>}
              <button className="secondary" onClick={() => loadBoard(e._id)}>Leaderboard</button>
            </div>
          </div>
        ))}
        {!events.length && <p className="empty">No events yet — check back soon!</p>}
      </div>
      {selected && board.length > 0 && (
        <div className="event-leaderboard">
          <h3>🏆 Event Leaderboard</h3>
          {board.map(p => (
            <div key={p.rank} className="lb-row">
              <span>#{p.rank}</span>
              <span>{p.username}</span>
              <span>{p.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
