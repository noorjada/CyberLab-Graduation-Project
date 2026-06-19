import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import '../ChallengeBuilder/ChallengeBuilder.css';
import './LabBuilder.css';

const EMPTY_DRAFT = {
  slug: '',
  title: '',
  description: '',
  category: 'web',
  difficulty: 'medium',
  points: 150,
  flag: '',
  estimatedTime: 30,
  dockerImage: '',
  tasks: [],
  tools: [],
  hints: [],
  files: [{ path: 'Dockerfile', content: '' }]
};

const LabBuilder = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [selectedFile, setSelectedFile] = useState(0);
  const [rebuilding, setRebuilding] = useState(null);

  useEffect(() => { loadLabs(); }, []);

  const loadLabs = async () => {
    try {
      const res = await api.get('/lab-builder/labs');
      setLabs(res.data);
    } catch {
      toast.error('Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  const generateLab = async () => {
    if (!aiPrompt.trim()) return toast.error('Describe the lab you want');
    setAiGenerating(true);
    try {
      const res = await api.post('/ai/generate-lab', { prompt: aiPrompt.trim() });
      setDraft(res.data.draft);
      setSelectedFile(0);
      toast.success('Lab draft generated — review Dockerfile, then publish');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const updateDraft = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const updateFile = (index, content) => {
    setDraft(prev => {
      const files = [...prev.files];
      files[index] = { ...files[index], content };
      return { ...prev, files };
    });
  };

  const slugExists = draft?.slug && labs.some(l => l.slug === draft.slug);

  const loadExistingLab = async (lab) => {
    if (!lab.slug) return toast.error('Lab has no slug');
    try {
      const [filesRes, fullRes] = await Promise.all([
        api.get(`/lab-builder/labs/${lab.slug}/files`),
        api.get(`/lab-builder/labs/by-id/${lab._id}`)
      ]);
      const full = fullRes.data;
      setDraft({
        slug: lab.slug,
        title: lab.title,
        description: lab.description,
        category: lab.category,
        difficulty: lab.difficulty,
        points: lab.points,
        flag: full.flag || '',
        estimatedTime: lab.estimatedTime || 30,
        dockerImage: lab.dockerImage,
        tasks: lab.tasks || [],
        tools: lab.tools || [],
        hints: lab.hints || [],
        files: filesRes.data.files?.length ? filesRes.data.files : [{ path: 'Dockerfile', content: '' }]
      });
      setSelectedFile(0);
      toast.info(`Loaded "${lab.title}" for editing`);
    } catch {
      toast.error('Failed to load lab files');
    }
  };

  const publish = async (skipBuild = false) => {
    if (!draft?.slug || !draft?.title) return toast.error('Draft incomplete');
    setPublishing(true);
    try {
      const res = await api.post('/lab-builder/publish', { draft, skipBuild });
      toast.success(res.data.message);
      setDraft(null);
      setAiPrompt('');
      await loadLabs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Publish failed';
      toast.error(msg);
      if (err.response?.data?.lab) await loadLabs();
    } finally {
      setPublishing(false);
    }
  };

  const rebuild = async (id) => {
    setRebuilding(id);
    try {
      const res = await api.post(`/lab-builder/labs/${id}/rebuild`);
      toast.success(res.data.message);
      await loadLabs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rebuild failed');
      await loadLabs();
    } finally {
      setRebuilding(null);
    }
  };

  const deleteLab = async (id, title) => {
    if (!window.confirm(`Delete lab "${title}" and its Docker files?`)) return;
    try {
      await api.delete(`/lab-builder/labs/${id}`);
      toast.success('Lab deleted');
      await loadLabs();
    } catch {
      toast.error('Delete failed');
    }
  };

  const statusBadge = (status) => {
    const colors = { ready: '#3fb950', building: '#f0c040', failed: '#f85149', draft: '#8b949e' };
    return <span style={{ color: colors[status] || '#8b949e' }}>{status || 'ready'}</span>;
  };

  if (loading) return <div className="loading">Loading lab builder...</div>;

  return (
    <div className="builder-page lab-builder-page">
      <div className="builder-header">
        <div>
          <h1>🖥️ AI Lab Builder</h1>
          <p>
            Describe a hacking lab in plain English — AI generates the Dockerfile, flags, tasks, and metadata.
            No manual coding required. Review, edit, then publish to build the Docker image and go live.
          </p>
        </div>
      </div>

      <div className="builder-layout">
        <aside className="builder-sidebar">
          <h3>Published Labs ({labs.length})</h3>
          {labs.map(lab => (
            <div key={lab._id} className="lab-list-item">
              <strong>{lab.title}</strong>
              <small>{lab.slug || lab.dockerImage} · {statusBadge(lab.buildStatus)}</small>
              <div className="lab-list-actions">
                {lab.slug && (
                  <button type="button" onClick={() => loadExistingLab(lab)}>✏️ Edit</button>
                )}
                {lab.slug && lab.buildStatus !== 'building' && (
                  <button type="button" onClick={() => rebuild(lab._id)} disabled={rebuilding === lab._id}>
                    {rebuilding === lab._id ? '...' : '🔨 Rebuild'}
                  </button>
                )}
                <button type="button" className="danger" onClick={() => deleteLab(lab._id, lab.title)}>🗑️</button>
              </div>
              {lab.buildError && <small className="build-error">{lab.buildError}</small>}
            </div>
          ))}
        </aside>

        <div className="builder-form-card">
          <div className="ai-generator-section lab-ai-section">
            <h2>🤖 Generate Hacking Lab with AI</h2>
            <p>Example: &quot;Create a medium difficulty SQL injection lab with a vulnerable PHP login form&quot;</p>
            <textarea
              className="ai-prompt-input"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g. Create an easy Linux enumeration lab where students find a hidden flag using find and cat"
              rows={3}
            />
            <button type="button" className="ai-generate-btn" onClick={generateLab} disabled={aiGenerating}>
              {aiGenerating ? 'Generating lab + Dockerfile...' : '✨ Generate Full Lab'}
            </button>
          </div>

          {draft && (
            <>
              <h2>📋 Review Draft</h2>

              {slugExists && (
                <div className="slug-exists-banner">
                  Slug <code>{draft.slug}</code> already exists — publish will <strong>update</strong> that lab and rebuild Docker.
                </div>
              )}

              <div className="builder-section">
                <h3>Lab Info</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Slug (folder name)</label>
                    <input value={draft.slug} onChange={e => updateDraft('slug', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Docker Image</label>
                    <input value={draft.dockerImage} onChange={e => updateDraft('dockerImage', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input value={draft.title} onChange={e => updateDraft('title', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows={3} value={draft.description} onChange={e => updateDraft('description', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={draft.category} onChange={e => updateDraft('category', e.target.value)}>
                      {['web', 'linux', 'network', 'forensics', 'crypto'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select value={draft.difficulty} onChange={e => updateDraft('difficulty', e.target.value)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Points</label>
                    <input type="number" value={draft.points} onChange={e => updateDraft('points', parseInt(e.target.value, 10))} />
                  </div>
                  <div className="form-group">
                    <label>Est. Time (min)</label>
                    <input type="number" value={draft.estimatedTime} onChange={e => updateDraft('estimatedTime', parseInt(e.target.value, 10))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Main Flag</label>
                  <input className="flag-input" value={draft.flag} onChange={e => updateDraft('flag', e.target.value)} />
                </div>
              </div>

              <div className="builder-section">
                <h3>📁 Generated Files</h3>
                <div className="file-tabs">
                  {draft.files.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      className={selectedFile === i ? 'active' : ''}
                      onClick={() => setSelectedFile(i)}
                    >
                      {f.path}
                    </button>
                  ))}
                </div>
                <textarea
                  className="dockerfile-editor"
                  value={draft.files[selectedFile]?.content || ''}
                  onChange={e => updateFile(selectedFile, e.target.value)}
                  spellCheck={false}
                />
              </div>

              {draft.tasks?.length > 0 && (
                <div className="builder-section">
                  <h3>✅ Tasks ({draft.tasks.length})</h3>
                  <ul className="draft-tasks-list">
                    {draft.tasks.map((t, i) => (
                      <li key={i}><strong>{t.title}</strong> — {t.description} <em>({t.points} pts)</em></li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="builder-actions lab-publish-actions">
                <button
                  type="button"
                  className="save-btn"
                  onClick={() => publish(false)}
                  disabled={publishing}
                >
                  {publishing ? 'Building Docker image...' : slugExists ? '🔄 Update Lab (rebuild + go live)' : '🚀 Publish Lab (build + go live)'}
                </button>
                <button
                  type="button"
                  className="draft-save-btn"
                  onClick={() => publish(true)}
                  disabled={publishing}
                >
                  Save draft only (skip Docker build)
                </button>
                <button type="button" className="delete-challenge-btn" onClick={() => setDraft(null)}>
                  Discard draft
                </button>
              </div>
            </>
          )}

          {!draft && (
            <div className="lab-builder-empty">
              <p>👆 Describe a lab above and AI will generate:</p>
              <ul>
                <li>Dockerfile with vulnerable app or Linux environment</li>
                <li>Flags, tasks, hints, and walkthrough</li>
                <li>All files written to <code>server/docker-labs/</code> on publish</li>
                <li>Docker image built automatically (<code>cyberlab-{'{slug}'}</code>)</li>
              </ul>
              <p className="docker-note">Requires Docker Desktop running on the server machine.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabBuilder;
