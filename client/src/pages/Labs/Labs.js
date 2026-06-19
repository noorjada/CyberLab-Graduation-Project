import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useLocation } from 'react-router-dom';

import { toast } from 'react-toastify';

import { useAuth } from '../../context/AuthContext';

import api from '../../utils/api';

import { API_ORIGIN } from '../../utils/userUtils';

import './Labs.css';
import LearningNotesPanel from '../../components/LearningNotes/LearningNotesPanel';
import AILabMentor from '../../components/AILabMentor/AILabMentor';
import TheoryLessonPanel from '../../components/TheoryLesson/TheoryLessonPanel';
import LearningObjectives from '../../components/LearningObjectives/LearningObjectives';



const formatTime = (seconds) => {

  if (seconds == null || seconds < 0) return '—';

  const h = Math.floor(seconds / 3600);

  const m = Math.floor((seconds % 3600) / 60);

  const s = seconds % 60;

  if (h > 0) {

    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  }

  return `${m}:${String(s).padStart(2, '0')}`;

};



const DifficultyStars = ({ difficulty, stars }) => {

  const count = stars || { easy: 2, medium: 3, hard: 5 }[difficulty] || 3;

  return (

    <span className="difficulty-stars" title={difficulty}>

      {Array.from({ length: 5 }, (_, i) => (

        <span key={i} className={i < count ? 'star filled' : 'star'}>★</span>

      ))}

    </span>

  );

};



const Labs = () => {

  const location = useLocation();

  const { user, refreshUser } = useAuth();

  const [labs, setLabs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedLab, setSelectedLab] = useState(null);

  const [labProgress, setLabProgress] = useState(null);

  const [session, setSession] = useState(null);

  const [timer, setTimer] = useState({ elapsedSeconds: 0, remainingSeconds: null });

  const [starting, setStarting] = useState(false);

  const [resetting, setResetting] = useState(false);

  const [flag, setFlag] = useState('');

  const [selectedFlagKey, setSelectedFlagKey] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState('all');

  const [terminalOutput, setTerminalOutput] = useState([]);

  const [command, setCommand] = useState('');

  const [executing, setExecuting] = useState(false);

  const [revealedHints, setRevealedHints] = useState({});

  const [walkthrough, setWalkthrough] = useState(null);

  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const [loadingWalkthrough, setLoadingWalkthrough] = useState(false);

  const [userRating, setUserRating] = useState(0);

  const [showMentor, setShowMentor] = useState(false);

  const [theoryReady, setTheoryReady] = useState(false);

  const terminalRef = useRef(null);

  const wsRef = useRef(null);

  const [liveShell, setLiveShell] = useState(false);

  useEffect(() => {
    setTheoryReady(false);
  }, [selectedLab?._id]);

  const categoryIcons = {

    web: '🌐', network: '🔒', linux: '🐧', forensics: '🔍', crypto: '🔐'

  };



  const difficultyColor = {

    easy: '#3fb950', medium: '#f0c040', hard: '#f85149'

  };



  useEffect(() => {

    fetchLabs();

  }, []);

  useEffect(() => {
    if (!labs.length) return;
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category && category !== 'all') setActiveTab(category);
    const open = params.get('open');
    if (!open) return;
    const decoded = decodeURIComponent(open);
    const match = labs.find(
      (l) => l.title.toLowerCase() === decoded.toLowerCase() || l._id === open
    );
    if (match) handleSelectLab(match);
  }, [labs, location.search]);



  useEffect(() => {

    if (terminalRef.current) {

      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;

    }

  }, [terminalOutput]);



  useEffect(() => {

    if (session?.status !== 'running') return undefined;



    const tick = () => {

      setTimer(prev => ({

        elapsedSeconds: (prev.elapsedSeconds || 0) + 1,

        remainingSeconds: prev.remainingSeconds != null

          ? Math.max(0, prev.remainingSeconds - 1)

          : null

      }));

    };



    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);

  }, [session?.status, session?.id]);



  const fetchLabs = async () => {

    try {

      const res = await api.get('/labs');

      setLabs(res.data);

    } catch (err) {

      toast.error('Failed to load labs');

    } finally {

      setLoading(false);

    }

  };



  const loadLabDetail = async (labId) => {

    const [detailRes, sessionRes] = await Promise.all([

      api.get(`/labs/${labId}`),

      api.get(`/labs/${labId}/session`)

    ]);

    setSelectedLab(detailRes.data);

    setLabProgress({

      solvedFlagKeys: detailRes.data.solvedFlagKeys || [],

      flagsSolved: detailRes.data.flagsSolved || 0,

      flagsTotal: detailRes.data.flagsTotal || 0,

      progressPercent: detailRes.data.progressPercent || 0,

      hintsRevealed: detailRes.data.hintsRevealed || 0,

      completed: detailRes.data.completed || false,

      pointsEarned: detailRes.data.pointsEarned || 0,

      totalActiveSeconds: detailRes.data.totalActiveSeconds || 0,

      taskStatus: detailRes.data.taskStatus || [],

      flagStatus: detailRes.data.flagStatus || [],

      tasksCompleted: detailRes.data.tasksCompleted || 0,

      tasksTotal: detailRes.data.tasksTotal || 0,

      completedAt: detailRes.data.completedAt

    });



    const hints = {};

    for (let i = 0; i < (detailRes.data.hintsRevealed || 0); i++) {

      try {

        const h = await api.post(`/labs/${labId}/hint/${i}`);

        hints[i] = h.data.hint;

      } catch { /* already revealed */ }

    }

    setRevealedHints(hints);



    if (sessionRes.data.status === 'running' && !detailRes.data.completed) {

      setSession(sessionRes.data);

      setTimer(sessionRes.data.timer || { elapsedSeconds: 0, remainingSeconds: null });

      addOutput('system', `Reconnected to existing session`);

    } else if (detailRes.data.completed) {

      setSession(null);

      setTimer({

        elapsedSeconds: detailRes.data.totalActiveSeconds || 0,

        remainingSeconds: null

      });

      addOutput('success', '✅ Lab completed — all requirements met');

    } else {

      setSession(null);

      setTimer({

        elapsedSeconds: detailRes.data.totalActiveSeconds || 0,

        remainingSeconds: null

      });

    }



    api.get(`/ratings/lab/${labId}`)

      .then(r => setUserRating(r.data.userScore || 0))

      .catch(() => {});



    if (detailRes.data.completed) {

      loadWalkthrough(labId, true);

    }

  };



  const handleSelectLab = async (lab) => {

    setTerminalOutput([]);

    setFlag('');

    setWalkthrough(null);

    setShowWalkthrough(false);

    try {

      await loadLabDetail(lab._id);

    } catch (err) {

      toast.error('Failed to load lab');

      setSelectedLab(lab);

      setSession(null);

    }

  };



  const applySessionResponse = (data) => {

    setSession(data.session);

    if (data.timer) setTimer(data.timer);

    if (data.progress) setLabProgress(data.progress);

  };



  const handleStartLab = async () => {

    setStarting(true);

    addOutput('system', `Starting lab: ${selectedLab.title}...`);

    addOutput('system', 'Pulling Docker image and creating container...');

    try {

      const res = await api.post(`/labs/${selectedLab._id}/start`);

      applySessionResponse(res.data);

      addOutput('success', '✅ Lab started successfully!');

      if (res.data.session.httpPort) {

        addOutput('system', `Web app: http://localhost:${res.data.session.httpPort}`);

      }

      addOutput('info', 'Timer started — capture all flags before session expires!');

      toast.success('Lab started! Happy hacking! 🎉');

    } catch (err) {

      addOutput('error', `Failed: ${err.response?.data?.message || 'Unknown error'}`);

      toast.error(err.response?.data?.message || 'Failed to start lab');

    } finally {

      setStarting(false);

    }

  };



  const handleResetLab = async () => {

    if (!window.confirm('Reset the lab environment? Your captured flags are kept, but the VM will restart fresh.')) {

      return;

    }

    setResetting(true);

    addOutput('system', '🔄 Resetting lab environment...');

    try {

      const res = await api.post(`/labs/${selectedLab._id}/reset`);

      applySessionResponse(res.data);

      setTerminalOutput([]);

      addOutput('success', '✅ Lab reset — fresh container ready!');

      addOutput('system', `Reset count: ${res.data.session.resetCount}`);

      if (res.data.session.httpPort) {

        addOutput('system', `Web app: http://localhost:${res.data.session.httpPort}`);

      }

      toast.success('Lab reset successfully');

    } catch (err) {

      addOutput('error', err.response?.data?.message || 'Reset failed');

      toast.error(err.response?.data?.message || 'Failed to reset lab');

    } finally {

      setResetting(false);

    }

  };



  const connectLiveShell = () => {

    if (wsRef.current) return;

    const token = localStorage.getItem('token');

    const wsBase = API_ORIGIN.replace(/^http/, 'ws');

    const ws = new WebSocket(`${wsBase}/api/labs/${selectedLab._id}/terminal?token=${token}`);

    ws.onopen = () => { addOutput('success', '🟢 Live shell connected'); setLiveShell(true); };

    ws.onmessage = (e) => addOutput('output', e.data);

    ws.onclose = () => { wsRef.current = null; setLiveShell(false); addOutput('system', 'Live shell disconnected'); };

    ws.onerror = () => toast.error('WebSocket terminal failed — using exec mode');

    wsRef.current = ws;

  };



  const handleExecCommand = async (e) => {

    e.preventDefault();

    if (!command.trim() || executing) return;



    const cmd = command.trim();

    setCommand('');

    addOutput('command', `$ ${cmd}`);



    if (liveShell && wsRef.current?.readyState === 1) {

      wsRef.current.send(cmd + '\n');

      return;

    }



    setExecuting(true);

    try {

      const res = await api.post(`/labs/${selectedLab._id}/exec`, { command: cmd });

      addOutput('output', res.data.output || '(no output)');

    } catch (err) {

      addOutput('error', err.response?.data?.message || 'Command failed');

    } finally {

      setExecuting(false);

    }

  };



  const handleStopLab = async () => {

    try {

      const res = await api.post(`/labs/${selectedLab._id}/stop`);

      setSession(null);

      setTimer(prev => ({

        elapsedSeconds: res.data.totalActiveSeconds || prev.elapsedSeconds,

        remainingSeconds: null

      }));

      addOutput('system', 'Lab stopped.');

      toast.success('Lab stopped');

    } catch (err) {

      toast.error('Failed to stop lab');

    }

  };



  const revealHint = async (index) => {

    try {

      const res = await api.post(`/labs/${selectedLab._id}/hint/${index}`);

      setRevealedHints(prev => ({ ...prev, [index]: res.data.hint }));

      setLabProgress(prev => ({ ...prev, hintsRevealed: res.data.hintsRevealed }));

      if (res.data.costPaid > 0) {

        toast.info(`-${res.data.costPaid} points for hint`);

        await refreshUser();

      }

    } catch (err) {

      toast.error(err.response?.data?.message || 'Failed to reveal hint');

    }

  };



  const loadWalkthrough = async (labId, silent = false) => {

    setLoadingWalkthrough(true);

    try {

      const res = await api.get(`/labs/${labId || selectedLab._id}/walkthrough`);

      setWalkthrough(res.data);

      if (!silent) setShowWalkthrough(true);

    } catch (err) {

      if (!silent) {

        toast.error(err.response?.data?.message || 'Walkthrough locked');

      }

    } finally {

      setLoadingWalkthrough(false);

    }

  };



  const rateLab = async (score) => {

    try {

      await api.post('/ratings', { itemType: 'lab', itemId: selectedLab._id, score });

      setUserRating(score);

      toast.success('Rating saved!');

    } catch {

      toast.error('Failed to rate');

    }

  };



  const handleSubmitFlag = async (e) => {

    e.preventDefault();

    setSubmitting(true);

    try {

      const payload = { flag };

      if (selectedFlagKey) payload.flagKey = selectedFlagKey;



      const res = await api.post(`/labs/${selectedLab._id}/submit`, payload);

      toast.success(`🎉 ${res.data.message} +${res.data.pointsEarned} pts`);

      addOutput('success', `🚩 ${res.data.flagLabel} captured! +${res.data.pointsEarned} pts`);



      setLabProgress(res.data.progress);

      setFlag('');

      setSelectedFlagKey('');

      await refreshUser();

      fetchLabs();



      if (res.data.labCompleted || res.data.sessionStopped) {

        addOutput('success', '🏆 Lab complete — all flags & tasks done. VM stopped automatically.');

        if (wsRef.current) {

          wsRef.current.close();

          wsRef.current = null;

        }

        setLiveShell(false);

        setSession(null);

        setTimer(prev => ({

          elapsedSeconds: res.data.progress?.totalActiveSeconds || prev.elapsedSeconds,

          remainingSeconds: null

        }));

        await loadWalkthrough(selectedLab._id, true);

        setShowWalkthrough(true);

      }

    } catch (err) {

      toast.error(err.response?.data?.message || 'Wrong flag');

      addOutput('error', '❌ Wrong flag, keep trying!');

    } finally {

      setSubmitting(false);

    }

  };



  const addOutput = useCallback((type, text) => {

    setTerminalOutput(prev => [...prev, { type, text, id: Date.now() + Math.random() }]);

  }, []);



  const filteredLabs = activeTab === 'all'

    ? labs

    : labs.filter(l => l.category === activeTab);



  const unsolvedFlags = selectedLab?.flags?.filter(

    f => !(labProgress?.solvedFlagKeys || []).includes(f.key)

  ) || [];



  if (loading) return <div className="loading">Loading labs...</div>;



  return (

    <div className="labs-page">

      {!selectedLab ? (

        <>

          <div className="labs-header">

            <h1>🖥️ Hacking Labs</h1>

            <p>Real virtual machines with multi-flag objectives, timed sessions, and unlockable walkthroughs.</p>

          </div>



          <div className="labs-tabs">

            {['all', 'web', 'network', 'linux', 'forensics', 'crypto'].map(tab => (

              <button

                key={tab}

                className={`labs-tab ${activeTab === tab ? 'active' : ''}`}

                onClick={() => setActiveTab(tab)}

              >

                {tab === 'all' ? '🌐 All' : `${categoryIcons[tab]} ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}

              </button>

            ))}

          </div>



          <div className="labs-grid">

            {filteredLabs.map(lab => (

              <div

                key={lab._id}

                className={`lab-card ${lab.completed ? 'completed' : ''}`}

                onClick={() => handleSelectLab(lab)}

              >

                <div className="lab-card-header">

                  <span className="lab-icon">{categoryIcons[lab.category]}</span>

                  {lab.completed && <span className="completed-badge">✅ Completed</span>}

                  {!lab.completed && lab.flagsTotal > 0 && lab.flagsSolved > 0 && (

                    <span className="progress-badge">{lab.flagsSolved}/{lab.flagsTotal} flags</span>

                  )}

                </div>

                <h3>{lab.title}</h3>

                <LearningObjectives
                  objectives={lab.learningObjectives}
                  compact
                  maxItems={2}
                />

                <p>{lab.description.substring(0, 100)}...</p>

                <div className="lab-difficulty-row">

                  <DifficultyStars difficulty={lab.difficulty} stars={lab.difficultyStars} />

                  <span style={{ color: difficultyColor[lab.difficulty] }} className="difficulty-label">

                    {lab.difficulty}

                  </span>

                </div>

                <div className="lab-meta">

                  <span>⚡ {lab.points} pts</span>

                  <span>⏱️ ~{lab.estimatedTime} min</span>

                  <span>👥 {lab.totalCompletions} solves</span>

                  {lab.ratingCount > 0 && (

                    <span>⭐ {lab.ratingAvg} ({lab.ratingCount})</span>

                  )}

                </div>

                {!lab.completed && lab.progressPercent > 0 && (

                  <div className="lab-progress-bar">

                    <div className="lab-progress-fill" style={{ width: `${lab.progressPercent}%` }} />

                  </div>

                )}

                <div className="lab-tools">

                  {lab.tools?.slice(0, 3).map((tool, i) => (

                    <span key={i} className="tool-tag">{tool}</span>

                  ))}

                </div>

              </div>

            ))}

          </div>

        </>

      ) : (

        <div className="lab-workspace">

          <div className="workspace-header">

            <button className="back-btn" onClick={() => {

              setSelectedLab(null);

              setWalkthrough(null);

              setShowWalkthrough(false);

            }}>

              ← Back to Labs

            </button>

            <div className="workspace-title">

              <span>{categoryIcons[selectedLab.category]}</span>

              <h2>{selectedLab.title}</h2>

              <DifficultyStars difficulty={selectedLab.difficulty} stars={selectedLab.difficultyStars} />

            </div>

            <div className="workspace-actions">

              {session?.status === 'running' ? (

                <>

                  <div className="lab-timer-display">

                    <span className="timer-elapsed" title="Active time">

                      ⏱️ {formatTime(timer.elapsedSeconds)}

                    </span>

                    {timer.remainingSeconds != null && (

                      <span className={`timer-remaining ${timer.remainingSeconds < 600 ? 'urgent' : ''}`} title="Session expires in">

                        ⏳ {formatTime(timer.remainingSeconds)}

                      </span>

                    )}

                  </div>

                  <button className="live-shell-btn" onClick={connectLiveShell} disabled={liveShell}>

                    {liveShell ? '🟢 Live Shell' : '⚡ Connect Live Shell'}

                  </button>

                  <button className="reset-btn" onClick={handleResetLab} disabled={resetting}>

                    {resetting ? '⏳ Resetting...' : '🔄 Reset Lab'}

                  </button>

                  <button className="stop-btn" onClick={handleStopLab}>

                    ⏹️ Stop Lab

                  </button>

                </>

              ) : labProgress?.completed ? (

                <span className="lab-done-badge">✅ Completed</span>

              ) : (

                <button
                  className="start-btn"
                  onClick={handleStartLab}
                  disabled={starting || (!theoryReady && selectedLab.theoryLesson?.enabled !== false)}
                  title={!theoryReady ? 'Complete lesson, videos, and quiz first' : ''}
                >

                  {starting ? '⏳ Starting...' : '▶️ Start Lab'}

                </button>

              )}

            </div>

          </div>



          <div className="workspace-body">

            <div className="workspace-left">

              {labProgress?.completed && (

                <div className="lab-completed-banner">

                  <span>🏆 Lab Completed</span>

                  {labProgress.completedAt && (

                    <small>{new Date(labProgress.completedAt).toLocaleString()}</small>

                  )}

                </div>

              )}



              <div className="lab-ecosystem-stats">

                <div className="eco-stat">

                  <span className="eco-label">Flags</span>

                  <span className="eco-value">

                    {labProgress?.flagsSolved || 0}/{labProgress?.flagsTotal || selectedLab.flags?.length || 1}

                  </span>

                  <div className="lab-progress-bar">

                    <div

                      className="lab-progress-fill"

                      style={{ width: `${labProgress?.progressPercent || 0}%` }}

                    />

                  </div>

                </div>

                <div className="eco-stat">

                  <span className="eco-label">Tasks</span>

                  <span className="eco-value">

                    {labProgress?.tasksCompleted || 0}/{labProgress?.tasksTotal || selectedLab.tasks?.length || 0}

                  </span>

                </div>

                <div className="eco-stat">

                  <span className="eco-label">Est. Time</span>

                  <span className="eco-value">~{selectedLab.estimatedTime} min</span>

                </div>

                <div className="eco-stat">

                  <span className="eco-label">Earned</span>

                  <span className="eco-value">⚡ {labProgress?.pointsEarned || 0} pts</span>

                </div>

              </div>



              <LearningObjectives objectives={selectedLab.learningObjectives} />

              <TheoryLessonPanel
                lesson={selectedLab.theoryLesson}
                itemType="lab"
                itemId={selectedLab._id}
                itemTitle={selectedLab.title}
                itemCategory={selectedLab.category}
                points={selectedLab.points}
                isCompleted={!!labProgress?.completed}
                onAcknowledge={() => setTheoryReady(true)}
              />

              <div className={
                theoryReady || selectedLab.theoryLesson?.enabled === false
                  ? 'theory-gated unlocked'
                  : 'theory-gated'
              }>

              <div className="lab-description">

                <h3>📋 Description</h3>

                <p>{selectedLab.description}</p>

              </div>



              <div className="lab-flags-panel">

                <h3>🚩 Flags ({labProgress?.flagsSolved || 0}/{labProgress?.flagsTotal || selectedLab.flags?.length || 0})</h3>

                {(labProgress?.flagStatus?.length ? labProgress.flagStatus : (selectedLab.flags || [{ key: 'main', label: 'Main Flag', points: selectedLab.points }])).map((f) => {

                  const solved = f.done ?? (labProgress?.solvedFlagKeys || []).includes(f.key);

                  return (

                    <div key={f.key} className={`flag-objective ${solved ? 'solved' : ''}`}>

                      <span className="flag-status">{solved ? '✅' : '⬜'}</span>

                      <div className="flag-objective-info">

                        <strong>{f.label}</strong>

                        <span>+{f.points} pts</span>

                      </div>

                    </div>

                  );

                })}

              </div>



              {(selectedLab.tasks?.length > 0 || labProgress?.taskStatus?.length > 0) && (

              <div className="lab-tasks">

                <h3>✅ Required Steps ({labProgress?.tasksCompleted || 0}/{labProgress?.tasksTotal || selectedLab.tasks?.length || 0})</h3>

                {(labProgress?.taskStatus?.length ? labProgress.taskStatus : selectedLab.tasks?.map((task, i) => ({ ...task, index: i, done: false })) || []).map((task, i) => (

                  <div key={task.index ?? i} className={`task-item ${task.done ? 'task-done' : ''}`}>

                    <div className="task-number">{task.done ? '✓' : (task.index ?? i) + 1}</div>

                    <div className="task-content">

                      <h4>{task.title}</h4>

                      <p>{task.description}</p>

                    </div>

                    <span className="task-points">{task.done ? 'Done' : `+${task.points} pts`}</span>

                  </div>

                ))}

              </div>

              )}



              {selectedLab.hints?.length > 0 && (

                <div className="lab-hints-panel">

                  <h3>💡 Hints</h3>

                  {selectedLab.hints.map((_, index) => {

                    const revealed = revealedHints[index] != null;

                    const costs = selectedLab.hintCosts || [0, 15, 30];

                    const cost = costs[index] ?? 30;

                    const canReveal = index === 0 || revealedHints[index - 1] != null;



                    return (

                      <div key={index} className={`hint-item ${revealed ? 'revealed' : ''}`}>

                        <div className="hint-header">

                          <span>Hint {index + 1}</span>

                          {!revealed && (

                            <span className="hint-cost">{cost === 0 ? 'Free' : `${cost} pts`}</span>

                          )}

                        </div>

                        {revealed ? (

                          <p className="hint-text">{revealedHints[index]}</p>

                        ) : canReveal ? (

                          <button className="hint-reveal-btn" onClick={() => revealHint(index)}>

                            Unlock hint

                          </button>

                        ) : (

                          <p className="hint-locked">Unlock previous hint first</p>

                        )}

                      </div>

                    );

                  })}

                </div>

              )}



              <div className="lab-tools-section">

                <h3>🛠️ Recommended Tools</h3>

                <div className="tools-list">

                  {selectedLab.tools?.map((tool, i) => (

                    <span key={i} className="tool-badge">{tool}</span>

                  ))}

                </div>

              </div>



              <button
                type="button"
                className="lab-mentor-btn"
                onClick={() => setShowMentor(true)}
              >
                <span>🧠 Ask Lab Mentor</span>
                <span className="mentor-sub">— debug your approach, learn concepts, no flag spoilers</span>
              </button>



              <div className="flag-section">

                <h3>🚩 Submit Flag</h3>

                {unsolvedFlags.length > 1 && (

                  <select

                    className="flag-key-select"

                    value={selectedFlagKey}

                    onChange={e => setSelectedFlagKey(e.target.value)}

                  >

                    <option value="">Auto-detect flag</option>

                    {unsolvedFlags.map(f => (

                      <option key={f.key} value={f.key}>{f.label}</option>

                    ))}

                  </select>

                )}

                <form onSubmit={handleSubmitFlag} className="flag-form">

                  <input

                    type="text"

                    value={flag}

                    onChange={e => setFlag(e.target.value)}

                    placeholder="FLAG{...}"

                    required

                  />

                  <button type="submit" disabled={submitting || labProgress?.completed}>

                    {submitting ? 'Submitting...' : labProgress?.completed ? 'Complete' : 'Submit'}

                  </button>

                </form>

              </div>



              <LearningNotesPanel
                linkType="lab"
                linkId={selectedLab._id}
                linkTitle={selectedLab.title}
                compact
              />

              <div className="lab-rating-section">

                <h3>⭐ Rate this lab</h3>

                <div className="rating-stars">

                  {[1, 2, 3, 4, 5].map(s => (

                    <button

                      key={s}

                      type="button"

                      className={`rate-star ${userRating >= s ? 'active' : ''}`}

                      onClick={() => rateLab(s)}

                    >

                      ★

                    </button>

                  ))}

                </div>

              </div>



              {labProgress?.completed && (

                <div className="walkthrough-unlock">

                  <h3>📖 Walkthrough</h3>

                  <p>Lab complete — solution guide unlocked!</p>

                  <button

                    className="walkthrough-btn"

                    onClick={() => loadWalkthrough()}

                    disabled={loadingWalkthrough}

                  >

                    {loadingWalkthrough ? 'Loading...' : '📖 View Walkthrough'}

                  </button>

                </div>

              )}

              </div>

            </div>



            <div className="workspace-right">

              <div className="lab-terminal">

                <div className="terminal-titlebar">

                  <div className="terminal-dots">

                    <span className="dot red"></span>

                    <span className="dot yellow"></span>

                    <span className="dot green"></span>

                  </div>

                  <span className="terminal-title">

                    {session?.status === 'running' ? '🟢 Connected' : '🔴 Not started'}

                    {session?.resetCount > 0 && ` · Reset ×${session.resetCount}`}

                  </span>

                </div>



                <div className="terminal-output" ref={terminalRef}>

                  {terminalOutput.length === 0 ? (

                    <p className="terminal-placeholder">

                      Click "▶️ Start Lab" to launch the virtual machine...

                    </p>

                  ) : (

                    terminalOutput.map(line => (

                      <div key={line.id} className={`terminal-line ${line.type}`}>

                        {line.text}

                      </div>

                    ))

                  )}

                  {executing && (

                    <div className="terminal-line system">Executing...</div>

                  )}

                </div>



                {session?.status === 'running' && (

                  <form onSubmit={handleExecCommand} className="terminal-input">

                    <span className="terminal-prompt">$</span>

                    <input

                      type="text"

                      value={command}

                      onChange={e => setCommand(e.target.value)}

                      placeholder="Enter command..."

                      disabled={executing}

                      autoFocus

                    />

                    <button type="submit" disabled={executing}>

                      {executing ? '⏳' : '➤'}

                    </button>

                  </form>

                )}

              </div>



              {(session?.httpPort || session?.containerPort) && (

                <div className="lab-webapp">

                  <h4>🌐 Web Application</h4>

                  <a

                    href={`http://localhost:${session.httpPort || session.containerPort}`}

                    target="_blank"

                    rel="noreferrer"

                    className="webapp-link"

                  >

                    Open Web App (port {session.httpPort || session.containerPort}) →

                  </a>

                </div>

              )}



              <div className="lab-info">

                <h4>ℹ️ Lab Info</h4>

                <div className="info-grid">

                  <div className="info-item">

                    <span>Category</span>

                    <span>{selectedLab.category}</span>

                  </div>

                  <div className="info-item">

                    <span>Difficulty</span>

                    <span style={{ color: difficultyColor[selectedLab.difficulty] }}>

                      {selectedLab.difficulty}

                    </span>

                  </div>

                  <div className="info-item">

                    <span>Points</span>

                    <span>⚡ {selectedLab.points}</span>

                  </div>

                  <div className="info-item">

                    <span>Est. Time</span>

                    <span>⏱️ {selectedLab.estimatedTime} min</span>

                  </div>

                  <div className="info-item">

                    <span>Active Time</span>

                    <span>{formatTime(timer.elapsedSeconds)}</span>

                  </div>

                  <div className="info-item">

                    <span>Session Limit</span>

                    <span>2 hours</span>

                  </div>

                </div>

              </div>

            </div>

          </div>



          {showWalkthrough && walkthrough && (

            <div className="walkthrough-modal-overlay" onClick={() => setShowWalkthrough(false)}>

              <div className="walkthrough-modal" onClick={e => e.stopPropagation()}>

                <div className="walkthrough-modal-header">

                  <h2>📖 Lab Walkthrough</h2>

                  <button className="modal-close" onClick={() => setShowWalkthrough(false)}>✕</button>

                </div>

                <p className="walkthrough-author">By {walkthrough.author || 'CyberLab Team'}</p>

                <div className="walkthrough-content">{walkthrough.content}</div>

                {walkthrough.steps?.length > 0 && (

                  <div className="walkthrough-steps">

                    <h4>Steps</h4>

                    <ol>

                      {walkthrough.steps.map((step, i) => (

                        <li key={i}>{step}</li>

                      ))}

                    </ol>

                  </div>

                )}

                {walkthrough.tools?.length > 0 && (

                  <div className="walkthrough-tools">

                    <h4>Tools Used</h4>

                    <div className="tools-list">

                      {walkthrough.tools.map((t, i) => (

                        <span key={i} className="tool-badge">{t}</span>

                      ))}

                    </div>

                  </div>

                )}

              </div>

            </div>

          )}

        </div>

      )}

      <AILabMentor
        lab={selectedLab}
        labProgress={labProgress}
        session={session}
        terminalOutput={terminalOutput}
        isOpen={showMentor && !!selectedLab}
        onClose={() => setShowMentor(false)}
      />

    </div>

  );

};



export default Labs;

