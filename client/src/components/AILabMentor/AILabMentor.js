import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';
import { useExam } from '../../context/ExamContext';
import '../AIHint.css';
import './AILabMentor.css';

const QUICK_QUESTIONS = [
  'Why is my approach not working?',
  'What should I check in the terminal?',
  'Explain the vulnerability in this lab',
  "I'm stuck — where do I start?",
  'Help me debug my last command',
];

const AILabMentor = ({ lab, labProgress, session, terminalOutput, isOpen, onClose }) => {
  const { inExam, session: examSession } = useExam();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!lab) return;
    const unsolved = (lab.flags || []).filter(
      f => !(labProgress?.solvedFlagKeys || []).includes(f.key)
    );
    const nextObj = unsolved[0]?.label || 'the main objective';
    const sessionNote = session?.status === 'running'
      ? 'Your VM is running — I can see your terminal activity.'
      : 'Start the lab VM when you are ready to practice.';

    setMessages([{
      role: 'assistant',
      content: `Hi! I'm your **Lab Mentor** for "${lab.title}".\n\n${sessionNote}\n\nAsk me things like "Why isn't my SQL injection working?" and I'll explain concepts, debug your approach, and guide you — without giving away flags.\n\nNext objective: **${nextObj}**`
    }]);
  }, [lab?._id, session?.status, labProgress?.solvedFlagKeys]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getTerminalContext = () => {
    if (!terminalOutput?.length) return [];
    return terminalOutput
      .slice(-15)
      .map(line => {
        const prefix = line.type === 'error' ? '[ERROR] ' : line.type === 'success' ? '[OK] ' : '';
        return `${prefix}${line.text}`;
      });
  };

  const sendMessage = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;

    setInput('');

    if (inExam) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🔒 Lab Mentor is disabled during "${examSession?.title || 'your practice exam'}". Finish or exit the exam first.`
      }]);
      return;
    }

    const updated = [...messages, { role: 'user', content: userMessage }];
    setMessages(updated);
    setLoading(true);

    try {
      const history = updated
        .slice(1, -1)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.post('/ai/lab-mentor', {
        labId: lab._id,
        userMessage,
        conversationHistory: history,
        recentTerminal: getTerminalContext()
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.message || 'Lab Mentor is unavailable. Try again shortly.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lab) return null;

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-panel lab-mentor-panel" onClick={e => e.stopPropagation()}>
        <div className="ai-header lab-mentor-header">
          <div className="ai-title">
            <span className="ai-avatar">🧠</span>
            <div>
              <h3>Lab Mentor</h3>
              <span className="ai-status lab-mentor-status">
                ● {session?.status === 'running' ? 'Lab active' : 'Concept mode'}
              </span>
            </div>
          </div>
          <button type="button" className="ai-close" onClick={onClose}>✕</button>
        </div>

        <div className="lab-mentor-context">
          {labProgress?.flagsSolved || 0}/{labProgress?.flagsTotal || lab.flags?.length || 1} flags
          {terminalOutput?.length > 0 && ` · ${Math.min(terminalOutput.length, 15)} terminal lines shared`}
        </div>

        <div className="ai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role}`}>
              {msg.role === 'assistant' && <span className="msg-avatar">🧠</span>}
              <div className="msg-bubble">
                {msg.content.split('\n').map((line, j, arr) => (
                  <span key={j}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}{j < arr.length - 1 && <br />}</span>
                ))}
              </div>
              {msg.role === 'user' && <span className="msg-avatar user-avatar">👤</span>}
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant">
              <span className="msg-avatar">🧠</span>
              <div className="msg-bubble typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="quick-questions">
          {QUICK_QUESTIONS.map((q, i) => (
            <button key={i} type="button" className="quick-btn lab-mentor-quick" onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="ai-input-form">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. Why is my SQL injection not working?"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? '...' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AILabMentor;
