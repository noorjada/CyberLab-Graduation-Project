import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './ChallengeBuilder.css';

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'web',
  difficulty: 'easy',
  points: 100,
  flag: '',
  hints: [{ text: '', cost: 0 }],
  writeup: { content: '', steps: [''], tools: [''] }
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ChallengeBuilder = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [existingFiles, setExistingFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [listRes, configRes] = await Promise.all([
        api.get('/challenges/manage/list'),
        api.get('/challenges/builder/config')
      ]);
      setChallenges(listRes.data);
      setConfig(configRes.data);
    } catch (err) {
      toast.error('Failed to load builder');
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setExistingFiles([]);
    setPendingFiles([]);
  };

  const loadChallenge = async (id) => {
    try {
      const res = await api.get(`/challenges/${id}/manage`);
      const c = res.data;
      setEditingId(c._id);
      setForm({
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        points: c.points,
        flag: c.flag,
        hints: c.hints?.length
          ? c.hints.map((text, i) => ({
              text,
              cost: c.hintCosts?.[i] ?? (i === 0 ? 0 : 15)
            }))
          : [{ text: '', cost: 0 }],
        writeup: {
          content: c.writeup?.content || '',
          steps: c.writeup?.steps?.length ? c.writeup.steps : [''],
          tools: c.writeup?.tools?.length ? c.writeup.tools : ['']
        }
      });
      setExistingFiles(c.files || []);
      setPendingFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load challenge');
    }
  };

  const updateField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const updateHint = (index, field, value) => {
    setForm(prev => {
      const hints = [...prev.hints];
      hints[index] = { ...hints[index], [field]: value };
      return { ...prev, hints };
    });
  };

  const addHint = () => {
    setForm(prev => ({
      ...prev,
      hints: [...prev.hints, { text: '', cost: 15 }]
    }));
  };

  const removeHint = (index) => {
    setForm(prev => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index)
    }));
  };

  const addFiles = (fileList) => {
    const max = config?.maxFiles || 10;
    const total = existingFiles.length + pendingFiles.length;
    const incoming = Array.from(fileList);
    const allowed = incoming.slice(0, max - total);

    if (allowed.length < incoming.length) {
      toast.warn(`Maximum ${max} files per challenge`);
    }
    setPendingFiles(prev => [...prev, ...allowed]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const uploadPendingFiles = async (challengeId) => {
    if (!pendingFiles.length) return;

    const formData = new FormData();
    pendingFiles.forEach(f => formData.append('files', f));

    const res = await api.post(`/challenges/${challengeId}/files`, formData);
    setExistingFiles(res.data.files);
    setPendingFiles([]);
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return toast.error('Describe the challenge you want');
    setAiGenerating(true);
    setAiDraft(null);
    try {
      const res = await api.post('/ai/generate-challenge', { prompt: aiPrompt.trim() });
      setAiDraft(res.data.draft);
      toast.success('Draft generated — review before publishing');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyDraft = () => {
    if (!aiDraft) return;
    setForm({
      title: aiDraft.title,
      description: aiDraft.description,
      category: aiDraft.category,
      difficulty: aiDraft.difficulty,
      points: aiDraft.points,
      flag: aiDraft.flag,
      hints: aiDraft.hints?.length
        ? aiDraft.hints.map((text, i) => ({ text, cost: i === 0 ? 0 : 15 }))
        : [{ text: '', cost: 0 }],
      writeup: {
        content: aiDraft.writeup?.content || '',
        steps: aiDraft.writeup?.steps?.length ? aiDraft.writeup.steps : [''],
        tools: aiDraft.writeup?.tools?.length ? aiDraft.writeup.tools : ['']
      }
    });
    setEditingId(null);
    setAiDraft(null);
    toast.info('Draft loaded into form — edit anything, then save');
  };

  const saveWriteup = async (challengeId) => {
    const w = form.writeup;
    if (!w?.content?.trim()) return;
    await api.put(`/challenges/${challengeId}/writeup`, {
      content: w.content.trim(),
      steps: w.steps.map(s => s.trim()).filter(Boolean),
      tools: w.tools.map(t => t.trim()).filter(Boolean),
      author: 'CyberLab Team'
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const hints = form.hints.map(h => h.text.trim()).filter(Boolean);
    const hintCosts = form.hints
      .filter(h => h.text.trim())
      .map(h => parseInt(h.cost, 10) || 0);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      difficulty: form.difficulty,
      points: parseInt(form.points, 10),
      flag: form.flag.trim(),
      hints,
      hintCosts
    };

    try {
      let challengeId = editingId;

      if (editingId) {
        await api.put(`/challenges/${editingId}`, payload);
        toast.success('Challenge updated!');
      } else {
        const res = await api.post('/challenges', payload);
        challengeId = res.data.challenge._id;
        setEditingId(challengeId);
        toast.success('Challenge created!');
      }

      if (pendingFiles.length && challengeId) {
        await uploadPendingFiles(challengeId);
        toast.success('Files uploaded!');
      }

      if (form.writeup?.content?.trim() && challengeId) {
        await saveWriteup(challengeId);
      }

      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!editingId) return;
    try {
      const res = await api.delete(`/challenges/${editingId}/files/${fileId}`);
      setExistingFiles(res.data.files);
      toast.success('File removed');
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const handleDeleteChallenge = async () => {
    if (!editingId) return;
    if (!window.confirm('Delete this challenge and all uploaded files?')) return;
    try {
      await api.delete(`/challenges/${editingId}`);
      toast.success('Challenge deleted');
      startNew();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <div className="loading">Loading builder...</div>;

  return (
    <div className="builder-page">
      <div className="builder-header">
        <div>
          <h1>🛠️ Challenge Builder</h1>
          <p>
            Create CTF challenges for courses — set flags, hints, points, and upload challenge files.
            {user?.role === 'instructor' && ' You can manage challenges you create.'}
          </p>
        </div>
      </div>

      <div className="builder-layout">
        <aside className="builder-sidebar">
          <button type="button" className="new-challenge-btn" onClick={startNew}>
            + New Challenge
          </button>
          <h3>Your Challenges ({challenges.length})</h3>
          {challenges.map(c => (
            <button
              key={c._id}
              type="button"
              className={`challenge-list-item ${editingId === c._id ? 'active' : ''}`}
              onClick={() => loadChallenge(c._id)}
            >
              {c.title}
              <small>
                {c.category} · {c.difficulty} · {c.fileCount || c.files?.length || 0} files
              </small>
            </button>
          ))}
          {challenges.length === 0 && (
            <p style={{ color: '#8b949e', fontSize: '0.85rem' }}>No challenges yet. Create your first!</p>
          )}
        </aside>

        <div className="builder-form-card">
          <div className="ai-generator-section">
            <h2>🤖 AI Challenge Generator</h2>
            <p>Describe a challenge and AI will draft title, description, hints, flag, difficulty, and writeup. Review and edit before publishing.</p>
            <textarea
              className="ai-prompt-input"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g. Create an intermediate SQL injection challenge with a login bypass scenario"
              rows={2}
            />
            <button type="button" className="ai-generate-btn" onClick={generateWithAI} disabled={aiGenerating}>
              {aiGenerating ? 'Generating...' : '✨ Generate Challenge'}
            </button>

            {aiDraft && (
              <div className="ai-draft-preview">
                <div className="ai-draft-header">
                  <strong>Generated draft</strong>
                  <button type="button" className="apply-draft-btn" onClick={applyDraft}>Use draft →</button>
                </div>
                <p><strong>{aiDraft.title}</strong> · {aiDraft.category} · {aiDraft.difficulty} · {aiDraft.points} pts</p>
                <p className="ai-draft-desc">{aiDraft.description}</p>
                <p className="ai-draft-flag">Flag: <code>{aiDraft.flag}</code></p>
                {aiDraft.hints?.length > 0 && (
                  <ul className="ai-draft-hints">
                    {aiDraft.hints.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          <h2>{editingId ? '✏️ Edit Challenge' : '✨ Create Challenge'}</h2>

          <form onSubmit={handleSave}>
            <div className="builder-section">
              <h3>Basic Info</h3>
              <div className="form-group">
                <label>Title *</label>
                <input
                  value={form.title}
                  onChange={e => updateField('title', e.target.value)}
                  placeholder="SQL Injection 101"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Describe the challenge scenario, objectives, and what students need to find..."
                  rows={5}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => updateField('category', e.target.value)}>
                    <option value="web">Web Security</option>
                    <option value="network">Network</option>
                    <option value="linux">Linux</option>
                    <option value="forensics">Forensics</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select value={form.difficulty} onChange={e => updateField('difficulty', e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Points *</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={form.points}
                    onChange={e => updateField('points', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="points-preview">
                Students earn <strong>{form.points}</strong> points on correct flag submission
              </div>
            </div>

            <div className="builder-section">
              <h3>🚩 Flag</h3>
              <div className="form-group">
                <label>Flag value *</label>
                <input
                  className="flag-input"
                  value={form.flag}
                  onChange={e => updateField('flag', e.target.value)}
                  placeholder="FLAG{your_secret_flag_here}"
                  required
                />
              </div>
            </div>

            <div className="builder-section">
              <h3>💡 Hints</h3>
              <p style={{ color: '#8b949e', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
                First hint is free for students; later hints cost points.
              </p>
              <div className="hints-builder">
                {form.hints.map((hint, i) => (
                  <div key={i} className="hint-row-builder">
                    <input
                      value={hint.text}
                      onChange={e => updateHint(i, 'text', e.target.value)}
                      placeholder={`Hint ${i + 1}`}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={hint.cost}
                      onChange={e => updateHint(i, 'cost', e.target.value)}
                      title="Point cost"
                    />
                    <button
                      type="button"
                      className="remove-hint-btn"
                      onClick={() => removeHint(i)}
                      disabled={form.hints.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="add-hint-btn" onClick={addHint}>
                + Add hint
              </button>
            </div>

            <div className="builder-section">
              <h3>📖 Official Writeup</h3>
              <p style={{ color: '#8b949e', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
                Shown to students after they solve. AI generator fills this automatically.
              </p>
              <div className="form-group">
                <label>Solution explanation</label>
                <textarea
                  value={form.writeup.content}
                  onChange={e => setForm(prev => ({ ...prev, writeup: { ...prev.writeup, content: e.target.value } }))}
                  placeholder="Full solution walkthrough..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Steps (one per line in fields below)</label>
                {form.writeup.steps.map((step, i) => (
                  <div key={i} className="hint-row-builder">
                    <input
                      value={step}
                      onChange={e => {
                        const steps = [...form.writeup.steps];
                        steps[i] = e.target.value;
                        setForm(prev => ({ ...prev, writeup: { ...prev.writeup, steps } }));
                      }}
                      placeholder={`Step ${i + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-hint-btn"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        writeup: { ...prev.writeup, steps: prev.writeup.steps.filter((_, j) => j !== i) }
                      }))}
                      disabled={form.writeup.steps.length === 1}
                    >✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-hint-btn"
                  onClick={() => setForm(prev => ({ ...prev, writeup: { ...prev.writeup, steps: [...prev.writeup.steps, ''] } }))}
                >+ Add step</button>
              </div>
            </div>

            <div className="builder-section">
              <h3>📎 Challenge Files</h3>
              <p style={{ color: '#8b949e', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
                Upload PCAPs, ZIPs, images, logs, etc. for forensics or downloadable challenges.
              </p>

              <div
                className={`file-dropzone ${dragging ? 'dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={e => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                <p>📁 Drop files here or click to browse</p>
                <small>
                  Max {config?.maxFiles || 10} files · {config?.maxFileSizeMb || 50} MB each
                  {config?.allowedExtensions && (
                    <> · {config.allowedExtensions.slice(0, 8).join(', ')}...</>
                  )}
                </small>
              </div>

              {pendingFiles.length > 0 && (
                <div className="pending-files">
                  <strong style={{ color: '#58a6ff', fontSize: '0.85rem' }}>Pending upload (save to attach)</strong>
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="file-item">
                      <span>{f.name} <span className="meta">({formatSize(f.size)})</span></span>
                      <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {existingFiles.length > 0 && (
                <div className="existing-files">
                  <strong style={{ color: '#3fb950', fontSize: '0.85rem' }}>Attached files</strong>
                  {existingFiles.map(f => (
                    <div key={f._id} className="file-item">
                      <span>{f.originalName} <span className="meta">({formatSize(f.size)})</span></span>
                      <button type="button" onClick={() => handleDeleteFile(f._id)}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="builder-actions">
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Challenge' : 'Create Challenge'}
              </button>
              {editingId && (
                <button type="button" className="delete-challenge-btn" onClick={handleDeleteChallenge}>
                  🗑️ Delete Challenge
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChallengeBuilder;
