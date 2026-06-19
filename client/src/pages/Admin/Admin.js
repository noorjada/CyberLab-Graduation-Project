import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AdminAnalytics from './AdminAnalytics';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: '', message: '', icon: '📢', link: '' });
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('analytics');
  const [labs, setLabs] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web',
    difficulty: 'easy',
    points: 50,
    flag: '',
    hints: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchChallenges();
    api.get('/admin/labs').then(r => setLabs(r.data)).catch(() => {});
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
    api.get('/admin/stats').then(r => setAdminStats(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (tab !== 'analytics' || !user || user.role !== 'admin') return;
    setAnalyticsLoading(true);
    api.get('/admin/analytics')
      .then(r => setAnalytics(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setAnalyticsLoading(false));
  }, [tab, user]);

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

  const handleAnnouncement = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/notifications/announce', announcement);
      toast.success('Announcement sent to all users!');
      setShowAnnouncement(false);
      setAnnouncement({ title: '', message: '', icon: '📢', link: '' });
    } catch (err) {
      toast.error('Failed to send announcement');
    } finally {
      setSending(false);
    }
  }; 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        points: parseInt(formData.points),
        hints: formData.hints.split('\n').filter(h => h.trim() !== '')
      };
      await api.post('/challenges', payload);
      toast.success('Challenge created successfully!');
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'web',
        difficulty: 'easy',
        points: 50,
        flag: '',
        hints: ''
      });
      fetchChallenges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create challenge');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/challenges/${id}`);
      toast.success('Challenge deleted');
      setChallenges(challenges.filter(c => c._id !== id));
    } catch (err) {
      toast.error('Failed to delete challenge');
    }
  };

  const difficultyColor = { easy: '#3fb950', medium: '#f0c040', hard: '#f85149' };
  const categoryIcons = { web: '🌐', network: '🔒', linux: '🐧', forensics: '🔍' };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>⚙️ Admin Panel</h1>
          <p>Manage CyberLab platform {adminStats && `· ${adminStats.users} users`}</p>
        </div>
        <div className="admin-tabs">
          {['analytics', 'challenges', 'labs', 'users'].map(t => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t === 'analytics' ? '📊 Analytics' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="add-btn" onClick={() => navigate('/builder')}>
            🛠️ Challenge Builder
          </button>
          <button className="add-btn" onClick={() => navigate('/lab-builder')}>
            🖥️ AI Lab Builder
          </button>
          <button className="add-btn" onClick={() => setShowForm(!showForm)} style={{ background: '#21262d', border: '1px solid #30363d' }}>
            {showForm ? '✕ Cancel' : '+ Quick Create'}
          </button>
          <button className="announce-btn" onClick={() => setShowAnnouncement(!showAnnouncement)}>
            {showAnnouncement ? '✕ Cancel' : '📢 Announce'}
          </button>
        </div>

      </div>

      {showAnnouncement && (
        <div className="admin-form-card" style={{ borderColor: '#f0c040' }}>
          <h2>📢 Send Announcement</h2>
          <form onSubmit={handleAnnouncement} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input
                  value={announcement.title}
                  onChange={e => setAnnouncement({...announcement, title: e.target.value})}
                  placeholder="Announcement title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Icon (emoji)</label>
                <input
                  value={announcement.icon}
                  onChange={e => setAnnouncement({...announcement, icon: e.target.value})}
                  placeholder="📢"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                value={announcement.message}
                onChange={e => setAnnouncement({...announcement, message: e.target.value})}
                placeholder="Announcement message"
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label>Link (optional)</label>
              <input
                value={announcement.link}
                onChange={e => setAnnouncement({...announcement, link: e.target.value})}
                placeholder="/challenges"
              />
            </div>
            <button type="submit" className="submit-btn" disabled={sending}>
              {sending ? 'Sending...' : '📢 Send to All Users'}
            </button>
          </form>
        </div>
      )}

      {showForm && (
        <div className="admin-form-card">
          <h2>Create New Challenge</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input name="title" value={formData.title} onChange={handleChange} placeholder="Challenge title" required />
              </div>
              <div className="form-group">
                <label>Flag</label>
                <input name="flag" value={formData.flag} onChange={handleChange} placeholder="FLAG{...}" required />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Challenge description" rows={4} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="web">Web Security</option>
                  <option value="network">Network Security</option>
                  <option value="linux">Linux</option>
                  <option value="forensics">Forensics</option>
                </select>
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="form-group">
                <label>Points</label>
                <input type="number" name="points" value={formData.points} onChange={handleChange} min="10" max="500" required />
              </div>
            </div>
            <div className="form-group">
              <label>Hints (one per line)</label>
              <textarea name="hints" value={formData.hints} onChange={handleChange} placeholder="Hint 1&#10;Hint 2&#10;Hint 3" rows={3} />
            </div>
            <button type="submit" className="submit-btn">Create Challenge</button>
          </form>
        </div>
      )}

      {tab === 'analytics' && (
        <AdminAnalytics analytics={analytics} loading={analyticsLoading} />
      )}

      {tab === 'challenges' && <div className="admin-stats">
        <div className="admin-stat">
          <h3>Total Challenges</h3>
          <p>{challenges.length}</p>
        </div>
        <div className="admin-stat">
          <h3>Web</h3>
          <p>{challenges.filter(c => c.category === 'web').length}</p>
        </div>
        <div className="admin-stat">
          <h3>Network</h3>
          <p>{challenges.filter(c => c.category === 'network').length}</p>
        </div>
        <div className="admin-stat">
          <h3>Linux</h3>
          <p>{challenges.filter(c => c.category === 'linux').length}</p>
        </div>
        <div className="admin-stat">
          <h3>Forensics</h3>
          <p>{challenges.filter(c => c.category === 'forensics').length}</p>
        </div>
      </div>}

      {tab === 'challenges' && <div className="challenges-table">
        <div className="table-header">
          <span>Challenge</span>
          <span>Category</span>
          <span>Difficulty</span>
          <span>Points</span>
          <span>Solves</span>
          <span>Actions</span>
        </div>
        {challenges.map(challenge => (
          <div key={challenge._id} className="table-row">
            <span className="challenge-title">{challenge.title}</span>
            <span>{categoryIcons[challenge.category]} {challenge.category}</span>
            <span style={{ color: difficultyColor[challenge.difficulty] }}>{challenge.difficulty}</span>
            <span>⚡ {challenge.points}</span>
            <span>👥 {challenge.solvedBy?.length || 0}</span>
            <span>
              <button className="delete-btn" onClick={() => handleDelete(challenge._id, challenge.title)}>
                🗑️ Delete
              </button>
            </span>
          </div>
        ))}
      </div>}

      {tab === 'labs' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button className="add-btn" onClick={() => navigate('/lab-builder')}>
              🖥️ Create Lab with AI
            </button>
          </div>
          <div className="challenges-table">
            <div className="table-header">
              <span>Lab</span><span>Category</span><span>Image</span><span>Build</span><span>Active</span>
            </div>
            {labs.map(lab => (
              <div key={lab._id} className="table-row">
                <span>{lab.title}</span>
                <span>{lab.category}</span>
                <span><code>{lab.dockerImage}</code></span>
                <span>{lab.buildStatus || 'ready'}</span>
                <span>{lab.isActive ? '✅' : '❌'}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="challenges-table">
          <div className="table-header"><span>User</span><span>Role</span><span>Points</span><span>Actions</span></div>
          {users.map(u => (
            <div key={u._id} className="table-row">
              <span>{u.username}</span>
              <span>{u.role}</span>
              <span>{u.points}</span>
              <span>
                {u.role === 'user' && (
                  <button onClick={async () => {
                    await api.put(`/admin/users/${u._id}/role`, { role: 'instructor' });
                    toast.success('Promoted to instructor');
                    const r = await api.get('/admin/users');
                    setUsers(r.data);
                  }}>Make Instructor</button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;