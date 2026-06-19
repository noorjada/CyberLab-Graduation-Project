import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './LearningNotes.css';

export const NOTE_TYPES = {
  note: { icon: '📝', label: 'Personal Note' },
  command: { icon: '⌨️', label: 'Command' },
  writeup: { icon: '📖', label: 'Writeup' },
  summary: { icon: '📋', label: 'Study Summary' }
};

const LearningNotesPanel = ({ linkType, linkId, linkTitle, compact = false }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: 'note', title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const loadNotes = async () => {
    if (!linkId) return;
    try {
      const res = await api.get(`/notes/linked/${linkType}/${linkId}`);
      setNotes(res.data);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadNotes();
  }, [linkType, linkId]);

  const openCreate = (type = 'note') => {
    setEditing(null);
    setForm({ type, title: '', content: type === 'command' ? '$ ' : '' });
    setShowForm(true);
  };

  const openEdit = (note) => {
    setEditing(note);
    setForm({ type: note.type, title: note.title, content: note.content });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        linkType,
        linkId,
        linkTitle
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
      toast.success('Note deleted');
      loadNotes();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (!linkId) return null;

  return (
    <div className={`notes-panel ${compact ? 'compact' : ''}`}>
      <div className="notes-panel-header">
        <h4>📓 Learning Notes</h4>
        <Link to={`/notes?linkType=${linkType}&linkId=${linkId}`} className="notes-view-all">
          View all →
        </Link>
      </div>

      <div className="notes-quick-add">
        {Object.entries(NOTE_TYPES).map(([key, meta]) => (
          <button key={key} type="button" className="notes-type-btn" onClick={() => openCreate(key)}>
            {meta.icon} {compact ? '' : meta.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="notes-empty">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="notes-empty">No notes yet — save commands, writeups, or study tips here.</p>
      ) : (
        <div className="notes-linked-list">
          {notes.slice(0, compact ? 3 : 10).map(note => (
            <div key={note._id} className={`note-card type-${note.type}`}>
              <div className="note-card-top">
                <span className="note-type-badge">
                  {NOTE_TYPES[note.type]?.icon} {NOTE_TYPES[note.type]?.label}
                </span>
                <div className="note-card-actions">
                  <button type="button" onClick={() => openEdit(note)}>Edit</button>
                  <button type="button" className="danger" onClick={() => handleDelete(note._id)}>✕</button>
                </div>
              </div>
              <strong className="note-card-title">{note.title}</strong>
              <pre className={`note-card-content ${note.type === 'command' ? 'command' : ''}`}>
                {note.content}
              </pre>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="notes-form-overlay" onClick={() => setShowForm(false)}>
          <div className="notes-form-modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Note' : 'Save Note'}</h3>
            <p className="notes-form-link">Linked to: {linkTitle}</p>
            <form onSubmit={handleSave}>
              <label>Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {Object.entries(NOTE_TYPES).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.icon} {meta.label}</option>
                ))}
              </select>
              <label>Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. SQLi payload that worked"
                required
              />
              <label>Content</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={form.type === 'command' ? 'nmap -sV target.com' : 'Your notes...'}
                rows={8}
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

export default LearningNotesPanel;
