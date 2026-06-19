import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';
import { useExam } from '../../context/ExamContext';
import './SOCAssistant.css';

const QUICK_PROMPTS = [
  'Analyze this Windows Event ID 4625 log spike',
  'IR playbook for ransomware on a domain controller',
  'Threat hunt hypothesis for lateral movement',
  'Splunk query to find PowerShell download cradles',
  'How do I triage a phishing email report?',
  'MITRE mapping for suspicious RDP connections',
];

const SOCAssistant = () => {
  const { inExam, session } = useExam();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🛡️ SOC Analyst AI — your blue-team assistant.\n\nI can help with log analysis, incident response playbooks, and threat hunting.\n\nPaste logs or describe an alert to get started.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;

    setInput('');

    if (inExam) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🔒 SOC Assistant is disabled during "${session?.title || 'your practice exam'}". Finish or exit the exam first.`
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

      const res = await api.post('/ai/soc', { message: userMessage, conversationHistory: history });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([{
      role: 'assistant',
      content: '🛡️ Session cleared. What incident or logs should we investigate?'
    }]);
  };

  return (
    <div className="soc-page">
      <div className="soc-header">
        <div>
          <h1>🛡️ SOC Analyst AI</h1>
          <p>Blue-team assistant for log analysis, incident response, and threat hunting</p>
        </div>
        <button type="button" className="soc-clear-btn" onClick={clear}>Clear session</button>
      </div>

      <div className="soc-layout">
        <aside className="soc-sidebar">
          <h3>Quick prompts</h3>
          {QUICK_PROMPTS.map((q, i) => (
            <button key={i} type="button" className="soc-quick-btn" onClick={() => send(q)}>
              {q}
            </button>
          ))}
          <div className="soc-capabilities">
            <h3>Capabilities</h3>
            <ul>
              <li>📋 Log & alert triage</li>
              <li>🚨 Incident response guidance</li>
              <li>🔍 Threat hunting hypotheses</li>
              <li>🎯 MITRE ATT&CK mapping</li>
              <li>🔎 SIEM query suggestions</li>
            </ul>
          </div>
        </aside>

        <div className="soc-chat">
          <div className="soc-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`soc-message ${msg.role}`}>
                <span className="soc-avatar">{msg.role === 'assistant' ? '🛡️' : '👤'}</span>
                <div className="soc-bubble">
                  {msg.content.split('\n').map((line, j, arr) => (
                    <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="soc-message assistant">
                <span className="soc-avatar">🛡️</span>
                <div className="soc-bubble typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="soc-input" onSubmit={e => { e.preventDefault(); send(); }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste logs, describe an alert, or ask for IR guidance..."
              rows={3}
              disabled={loading}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? 'Analyzing...' : 'Send →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SOCAssistant;
