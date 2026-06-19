import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './VirusTotal.css';

const VirusTotalPage = () => {
  const [activeTab, setActiveTab] = useState('url');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const tabs = [
    { id: 'url', label: '🔗 URL Scanner', placeholder: 'Enter URL (e.g. https://example.com)' },
    { id: 'ip', label: '🌐 IP Scanner', placeholder: 'Enter IP address (e.g. 8.8.8.8)' },
    { id: 'domain', label: '🏠 Domain Scanner', placeholder: 'Enter domain (e.g. google.com)' },
  ];

  const handleScan = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      let res;
      if (activeTab === 'url') {
        res = await api.post('/vt/url', { url: input.trim() });
      } else if (activeTab === 'ip') {
        res = await api.get(`/vt/ip/${input.trim()}`);
      } else {
        res = await api.get(`/vt/domain/${input.trim()}`);
      }
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict) => {
    if (verdict === 'MALICIOUS') return '#f85149';
    if (verdict === 'SUSPICIOUS') return '#f0c040';
    return '#3fb950';
  };

  const getVerdictIcon = (verdict) => {
    if (verdict === 'MALICIOUS') return '🚨';
    if (verdict === 'SUSPICIOUS') return '⚠️';
    return '✅';
  };

  return (
    <div className="vt-page">
      <div className="vt-header">
        <h1>🦠 Malware Analysis Lab</h1>
        <p>Scan URLs, IPs, and domains for malware using VirusTotal</p>
      </div>

      <div className="vt-warning">
        ⚠️ Educational use only. Powered by VirusTotal — 70+ antivirus engines.
      </div>

      <div className="vt-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`vt-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setResult(null); setInput(''); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="vt-input-section">
        <form onSubmit={handleScan} className="vt-form">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={tabs.find(t => t.id === activeTab)?.placeholder}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? '🔄 Scanning...' : '🔍 Scan'}
          </button>
        </form>

        <div className="quick-targets">
          <span>Quick test:</span>
          {activeTab === 'url' ? (
            <>
              <button onClick={() => setInput('https://google.com')}>google.com</button>
              <button onClick={() => setInput('https://github.com')}>github.com</button>
            </>
          ) : activeTab === 'ip' ? (
            <>
              <button onClick={() => setInput('8.8.8.8')}>8.8.8.8</button>
              <button onClick={() => setInput('1.1.1.1')}>1.1.1.1</button>
            </>
          ) : (
            <>
              <button onClick={() => setInput('google.com')}>google.com</button>
              <button onClick={() => setInput('github.com')}>github.com</button>
            </>
          )}
        </div>

        {loading && (
          <div className="vt-scanning">
            <div className="scan-animation">
              <div className="scan-line"></div>
            </div>
            <p>Scanning with 70+ antivirus engines...</p>
          </div>
        )}
      </div>

      {result && (
        <div className="vt-result">
          <div className="verdict-banner" style={{
            background: getVerdictColor(result.verdict) + '20',
            borderColor: getVerdictColor(result.verdict)
          }}>
            <span className="verdict-icon">{getVerdictIcon(result.verdict)}</span>
            <div>
              <h2 style={{ color: getVerdictColor(result.verdict) }}>
                {result.verdict}
              </h2>
              <p>{result.url || result.ip || result.domain}</p>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-box malicious">
              <span className="stat-num">{result.malicious}</span>
              <span className="stat-label">Malicious</span>
            </div>
            <div className="stat-box suspicious">
              <span className="stat-num">{result.suspicious}</span>
              <span className="stat-label">Suspicious</span>
            </div>
            <div className="stat-box harmless">
              <span className="stat-num">{result.harmless}</span>
              <span className="stat-label">Harmless</span>
            </div>
            <div className="stat-box undetected">
              <span className="stat-num">{result.undetected}</span>
              <span className="stat-label">Undetected</span>
            </div>
            <div className="stat-box total">
              <span className="stat-num">{result.total}</span>
              <span className="stat-label">Total Engines</span>
            </div>
          </div>

          <div className="detection-bar">
            <div
              className="detection-fill"
              style={{
                width: `${result.total > 0 ? (result.malicious / result.total) * 100 : 0}%`
              }}
            />
          </div>
          <p className="detection-text">
            {result.malicious} out of {result.total} engines detected this as malicious
          </p>

          {result.detections && result.detections.length > 0 && (
            <div className="detections-list">
              <h4>🚨 Detected by:</h4>
              <div className="detections-grid">
                {result.detections.map((d, i) => (
                  <div key={i} className="detection-item">
                    <span className="engine-name">{d.engine}</span>
                    <span className="engine-result">{d.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.categories && Object.keys(result.categories).length > 0 && (
            <div className="categories-section">
              <h4>📂 Categories</h4>
              <div className="categories-list">
                {Object.entries(result.categories).map(([source, cat], i) => (
                  <span key={i} className="category-tag">{cat}</span>
                ))}
              </div>
            </div>
          )}

          {result.reputation !== undefined && (
            <div className="reputation-section">
              <h4>⭐ Reputation Score</h4>
              <span style={{
                color: result.reputation >= 0 ? '#3fb950' : '#f85149',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                {result.reputation}
              </span>
              <p className="reputation-note">
                Positive = trusted, Negative = suspicious
              </p>
            </div>
          )}
        </div>
      )}

      <div className="vt-learn">
        <h3>📚 What you're learning</h3>
        <div className="learn-grid">
          <div className="learn-item">
            <h4>🦠 Malware Detection</h4>
            <p>How antivirus engines detect malicious content using signatures, heuristics, and behavioral analysis.</p>
          </div>
          <div className="learn-item">
            <h4>🔗 URL Analysis</h4>
            <p>Identifying phishing sites, malware distribution URLs, and suspicious redirects.</p>
          </div>
          <div className="learn-item">
            <h4>🌐 Threat Intelligence</h4>
            <p>Using reputation databases to assess risk — a core skill in SOC analysis and incident response.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirusTotalPage;