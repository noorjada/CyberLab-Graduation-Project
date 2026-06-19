import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { NOTE_TYPES } from '../../components/LearningNotes/LearningNotesPanel';
import '../../components/LearningNotes/LearningNotes.css';

const LearningNotes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState({ total: 0, byType: {} });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterLink, setFilterLink] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    type: 'note',
    title: '',
    content: '',
    linkType: 'general',
    linkId: '',
    linkTitle: ''
  });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const linkTypeParam = searchParams.get('linkType');
  const linkIdParam = searchParams.get('linkId');

  useEffect(() => {
    if (linkTypeParam && linkIdParam) {
      setFilterLink(linkTypeParam);
    }
  }, [linkTypeParam, linkIdParam]);

  const loadNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (filterLink !== 'all') params.set('linkType', filterLink);
      if (linkIdParam && filterLink !== 'general') params.set('linkId', linkIdParam);
      if (search.trim()) params.set('q', search.trim());

      const [notesRes, statsRes] = await Promise.all([
        api.get(`/notes?${params}`),
        api.get('/notes/stats')
      ]);
      setNotes(notesRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(loadNotes, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [filterType, filterLink, linkIdParam, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      type: 'note',
      title: '',
      content: '',
      linkType: linkTypeParam || 'general',
      linkId: linkIdParam || '',
      linkTitle: ''
    });
    setShowForm(true);
  };

  const openEdit = (note) => {
    setEditing(note);
    setForm({
      type: note.type,
      title: note.title,
      content: note.content,
      linkType: note.linkType,
      linkId: note.linkId || '',
      linkTitle: note.linkTitle || ''
    });
    setShowForm(true);
    setSelected(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        title: form.title,
        content: form.content,
        linkType: form.linkType,
        linkId: form.linkType === 'general' ? undefined : form.linkId || undefined,
        linkTitle: form.linkTitle
      };
      if (editing) {
        await api.put(`/notes/${editing._id}`, payload);
        toast.success('Note updated');
      } else {
        await api.post('/notes', payload);
        toast.success('Note saved');
      }
      setShowForm(false);
      loadNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Deleted');
      setSelected(null);
      loadNotes();
    } catch {
      toast.error('Delete failed');
    }
  };

  const linkPath = (note) => {
    if (note.linkType === 'challenge') return `/challenges`;
    if (note.linkType === 'lab') return `/labs`;
    return null;
  };

  if (loading && notes.length === 0) {
    return <div className="loading">Loading your notes...</div>;
  }

  return (
    <div className="notes-page">
      <div className="notes-page-header">
        <h1>📓 Learning Notes</h1>
        <p>Save personal notes, commands, writeups, and study summaries — linked to challenges and labs.</p>
      </div>

      <div className="notes-layout">
        <aside className="notes-sidebar">
          <h3>Filter by type</h3>
          <button
            type="button"
            className={`notes-filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            📚 All ({stats.total})
          </button>
          {Object.entries(NOTE_TYPES).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              className={`notes-filter-btn ${filterType === key ? 'active' : ''}`}
              onClick={() => setFilterType(key)}
            >
              {meta.icon} {meta.label} ({stats.byType?.[key] || 0})
            </button>
          ))}

          <h3 style={{ marginTop: '1.2rem' }}>Linked to</h3>
          {['all', 'challenge', 'lab', 'general'].map(l => (
            <button
              key={l}
              type="button"
              className={`notes-filter-btn ${filterLink === l ? 'active' : ''}`}
              onClick={() => {
                setFilterLink(l);
                if (l === 'all') setSearchParams({});
              }}
            >
              {l === 'all' ? '🔗 All links' : l === 'general' ? '📝 General' : l === 'challenge' ? '🚩 Challenges' : '🖥️ Labs'}
            </button>
          ))}
        </aside>

        <div className="notes-main">
          <div className="notes-main-toolbar">
            <input
              className="notes-search"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="button" className="notes-new-btn" onClick={openCreate}>
              + New Note
            </button>
          </div>

          {linkIdParam && (
            <p style={{ color: '#58a6ff', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Filtered to linked item · <button type="button" style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }} onClick={() => setSearchParams({})}>Clear</button>
            </p>
          )}

          {notes.length === 0 ? (
            <div className="notes-empty" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>No notes found. Start learning and save what matters!</p>
              <button type="button" className="notes-new-btn" onClick={openCreate} style={{ marginTop: '1rem' }}>
                Create your first note
              </button>
            </div>
          ) : (
            <div className="notes-grid">
              {notes.map(note => (
                <div
                  key={note._id}
                  className={`note-card type-${note.type}`}
                  onClick={() => setSelected(note)}
                >
                  <div className="note-card-top">
                    <span className="note-type-badge">
                      {NOTE_TYPES[note.type]?.icon} {NOTE_TYPES[note.type]?.label}
                    </span>
                  </div>
                  <strong className="note-card-title">{note.title}</strong>
                  <pre className={`note-card-content ${note.type === 'command' ? 'command' : ''}`}>
                    {note.content.length > 200 ? `${note.content.slice(0, 200)}...` : note.content}
                  </pre>
                  {note.linkType !== 'general' && note.linkTitle && (
                    <span className="note-link-tag">
                      {note.linkType === 'challenge' ? '🚩' : '🖥️'} {note.linkTitle}
                    </span>
                  )}
                  <p className="note-date">
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && !showForm && (
        <div className="notes-form-overlay" onClick={() => setSelected(null)}>
          <div className="notes-form-modal" onClick={e => e.stopPropagation()}>
            <span className="note-type-badge">
              {NOTE_TYPES[selected.type]?.icon} {NOTE_TYPES[selected.type]?.label}
            </span>
            <h3 style={{ marginTop: '0.5rem' }}>{selected.title}</h3>
            {selected.linkTitle && (
              <p className="notes-form-link">
                Linked: {selected.linkType} — {selected.linkTitle}
                {linkPath(selected) && (
                  <> · <Link to={linkPath(selected)}>Open</Link></>
                )}
              </p>
            )}
            <pre className={`note-card-content ${selected.type === 'command' ? 'command' : ''}`} style={{ maxHeight: 'none' }}>
              {selected.content}
            </pre>
            <p className="note-date">
              Created {new Date(selected.createdAt).toLocaleString()} · Updated {new Date(selected.updatedAt).toLocaleString()}
            </p>
            <div className="notes-form-actions">
              <button type="button" className="cancel" onClick={() => setSelected(null)}>Close</button>
              <button type="button" className="cancel" style={{ color: '#f85149' }} onClick={() => handleDelete(selected._id)}>Delete</button>
              <button type="button" className="save" onClick={() => openEdit(selected)}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="notes-form-overlay" onClick={() => setShowForm(false)}>
          <div className="notes-form-modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Note' : 'New Note'}</h3>
            <form onSubmit={handleSave}>
              <label>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(NOTE_TYPES).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.icon} {meta.label}</option>
                ))}
              </select>
              <label>Link to</label>
              <select
                value={form.linkType}
                onChange={e => setForm(f => ({ ...f, linkType: e.target.value, linkId: '' }))}
              >
                <option value="general">General (not linked)</option>
                <option value="challenge">Challenge</option>
                <option value="lab">Lab</option>
              </select>
              {form.linkType !== 'general' && (
                <>
                  <label>{form.linkType === 'challenge' ? 'Challenge' : 'Lab'} ID</label>
                  <input
                    value={form.linkId}
                    onChange={e => setForm(f => ({ ...f, linkId: e.target.value }))}
                    placeholder="Paste ID from challenge/lab URL or page"
                  />
                  <label>Display name (optional)</label>
                  <input
                    value={form.linkTitle}
                    onChange={e => setForm(f => ({ ...f, linkTitle: e.target.value }))}
                    placeholder="e.g. SQL Injection 101"
                  />
                </>
              )}
              <label>Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
              <label>Content</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={10}
                required
                className={form.type === 'command' ? 'command-input' : ''}
              />
              <div className="notes-form-actions">
                <button type="button" className="cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningNotes;
