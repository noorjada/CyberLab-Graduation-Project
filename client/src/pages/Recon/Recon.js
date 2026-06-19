import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './Recon.css';

const Recon = () => {
  const [activeTab, setActiveTab] = useState('ip');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyzePassword = (password) => {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'letmein',
      'qwerty', 'monkey', 'master', 'dragon', 'shadow',
      '1234567890', 'superman', 'batman', 'football', 'soccer',
      'iloveyou', 'sunshine', 'princess', 'welcome', 'abc123',
      'pass', 'test', 'root', 'toor', 'admin123', 'passw0rd'
    ];

    const length = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isCommon = commonPasswords.includes(password.toLowerCase());

    let score = 0;
    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 2;
    if (isCommon) score = 0;

    let strength = 'Very Weak';
    let color = '#f85149';
    if (score >= 7) { strength = 'Very Strong'; color = '#3fb950'; }
    else if (score >= 5) { strength = 'Strong'; color = '#58a6ff'; }
    else if (score >= 3) { strength = 'Moderate'; color = '#f0c040'; }
    else if (score >= 1) { strength = 'Weak'; color = '#f85149'; }

    const charsetSize =
      (hasUpper ? 26 : 0) +
      (hasLower ? 26 : 0) +
      (hasNumber ? 10 : 0) +
      (hasSpecial ? 32 : 0);

    const entropy = charsetSize > 0
      ? Math.round(length * Math.log2(charsetSize))
      : 0;

    const crackTime = entropy < 28 ? 'Instantly' :
      entropy < 36 ? 'Few seconds' :
      entropy < 60 ? 'Few hours' :
      entropy < 80 ? 'Few years' :
      'Centuries';

    const suggestions = [];
    if (length < 8) suggestions.push('Use at least 8 characters');
    if (length < 12) suggestions.push('Use 12+ characters for better security');
    if (!hasUpper) suggestions.push('Add uppercase letters (A-Z)');
    if (!hasLower) suggestions.push('Add lowercase letters (a-z)');
    if (!hasNumber) suggestions.push('Add numbers (0-9)');
    if (!hasSpecial) suggestions.push('Add special characters (!@#$%^&*)');
    if (isCommon) suggestions.push('This is a commonly used password — change it immediately!');

    return {
      password: password.replace(/./g, '•'),
      length,
      strength,
      color,
      score,
      maxScore: 8,
      entropy,
      crackTime,
      isCommon,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      suggestions,
      breached: isCommon || score < 2
    };
  };

  const analyzeEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: 'Invalid email format' };
    }

    const parts = email.split('@');
    const username = parts[0];
    const domain = parts[1];

    const suspiciousDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email', 'temp-mail.org'];
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com'];

    const isSuspicious = suspiciousDomains.includes(domain.toLowerCase());
    const isFreeProvider = freeProviders.includes(domain.toLowerCase());

    const osintTips = [
      `Search Google for: "${email}"`,
      `Check LinkedIn for this email`,
      `Try Sherlock tool: sherlock ${username}`,
      `Search Twitter/X for: "${username}"`,
      `Check GitHub: github.com/search?q=${username}`,
      `Try theHarvester: theHarvester -d ${domain} -b google`
    ];

    return {
      email,
      username,
      domain,
      isSuspicious,
      isFreeProvider,
      emailType: isSuspicious ? 'Disposable/Temp Email' : isFreeProvider ? 'Free Provider' : 'Custom Domain',
      osintTips,
      recommendation: isSuspicious
        ? '⚠️ This appears to be a disposable email address'
        : isFreeProvider
        ? '✅ Standard free email provider'
        : '🏢 Custom domain email — could be business or personal'
    };
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (activeTab === 'password') {
      setResult(analyzePassword(input.trim()));
      return;
    }

    if (activeTab === 'email') {
      setResult(analyzeEmail(input.trim()));
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let res;
      if (activeTab === 'ip') {
        res = await api.get(`/recon/ip/${input.trim()}`);
      } else if (activeTab === 'dns') {
        res = await api.get(`/recon/dns/${input.trim()}`);
      } else {
        res = await api.get(`/recon/whois/${input.trim()}`);
      }
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const getMyIP = async () => {
    setInput('me');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.get('/recon/ip/me');
      setResult(res.data);
      setInput(res.data.ip);
    } catch (err) {
      toast.error('Failed to get your IP');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'ip', label: '🌐 IP Lookup', placeholder: 'Enter IP address (e.g. 8.8.8.8)' },
    { id: 'dns', label: '📡 DNS Lookup', placeholder: 'Enter domain (e.g. google.com)' },
    { id: 'whois', label: '🔍 Whois', placeholder: 'Enter domain (e.g. example.com)' },
    { id: 'password', label: '🔑 Password Audit', placeholder: 'Enter password to analyze' },
    { id: 'email', label: '📧 Email OSINT', placeholder: 'Enter email address' },
  ];

  const countryFlags = {
    US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', JP: '🇯🇵',
    CN: '🇨🇳', RU: '🇷🇺', CA: '🇨🇦', AU: '🇦🇺', IN: '🇮🇳',
    PS: '🇵🇸', IL: '🇮🇱', SA: '🇸🇦', AE: '🇦🇪', EG: '🇪🇬'
  };

  return (
    <div className="recon-page">
      <div className="recon-header">
        <h1>🔭 Network Recon Lab</h1>
        <p>Practice real OSINT and network reconnaissance techniques</p>
      </div>

      <div className="recon-warning">
        ⚠️ This tool is for educational purposes only. Only perform reconnaissance on systems you own or have permission to test.
      </div>

      <div className="recon-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`recon-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setResult(null); setInput(''); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="recon-input-section">
        <form onSubmit={handleLookup} className="recon-form">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={tabs.find(t => t.id === activeTab)?.placeholder}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? '🔄 Scanning...' : '🔍 Lookup'}
          </button>
          {activeTab === 'ip' && (
            <button type="button" className="my-ip-btn" onClick={getMyIP}>
              📍 My IP
            </button>
          )}
        </form>

        <div className="quick-targets">
          <span>Quick test:</span>
          {activeTab === 'ip' ? (
            <>
              <button onClick={() => setInput('8.8.8.8')}>8.8.8.8 (Google DNS)</button>
              <button onClick={() => setInput('1.1.1.1')}>1.1.1.1 (Cloudflare)</button>
              <button onClick={() => setInput('208.67.222.222')}>OpenDNS</button>
            </>
          ) : (
            <>
              <button onClick={() => setInput('google.com')}>google.com</button>
              <button onClick={() => setInput('github.com')}>github.com</button>
              <button onClick={() => setInput('cloudflare.com')}>cloudflare.com</button>
            </>
          )}
        </div>
      </div>

      {result && (
        <div className="recon-result">
          {activeTab === 'ip' && (
            <>
              <div className="result-header">
                <h2>
                  {countryFlags[result.country] || '🌐'} {result.ip}
                </h2>
                <div className="result-tags">
                  {result.isVPN && <span className="tag vpn">VPN</span>}
                  {result.isProxy && <span className="tag proxy">Proxy</span>}
                  {result.isTor && <span className="tag tor">Tor</span>}
                  {result.isHosting && <span className="tag hosting">Hosting</span>}
                  {!result.isVPN && !result.isProxy && !result.isTor && (
                    <span className="tag clean">Clean IP</span>
                  )}
                </div>
              </div>

              <div className="result-grid">
                <div className="result-item">
                  <span className="result-label">📍 Location</span>
                  <span className="result-value">{result.city}, {result.region}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">🌍 Country</span>
                  <span className="result-value">{result.country}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">🏢 Organization</span>
                  <span className="result-value">{result.org}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">🖥️ Hostname</span>
                  <span className="result-value">{result.hostname}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">⏰ Timezone</span>
                  <span className="result-value">{result.timezone}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">📮 Postal</span>
                  <span className="result-value">{result.postal}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">🗺️ Coordinates</span>
                  <span className="result-value">{result.location}</span>
                </div>
              </div>

              <div className="result-raw">
                <h4>Raw JSON Output</h4>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </>
          )}

          {activeTab === 'dns' && (
            <>
              <div className="result-header">
                <h2>📡 DNS Records for {result.domain}</h2>
              </div>
              <div className="dns-records">
                {result.records.map((record, i) => (
                  <div key={i} className="dns-record">
                    <span className="dns-type">{record.type}</span>
                    <span className="dns-data">{record.data}</span>
                    <span className="dns-ttl">TTL: {record.ttl}s</span>
                  </div>
                ))}
              </div>
              <div className="result-raw">
                <h4>Raw JSON Output</h4>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </>
          )}

          {activeTab === 'whois' && (
            <>
              <div className="result-header">
                <h2>🔍 Whois for {result.domain}</h2>
              </div>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-label">🌐 IP Address</span>
                  <span className="result-value">{result.ip}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">🏢 Organization</span>
                  <span className="result-value">{result.org}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">🌍 Country</span>
                  <span className="result-value">{result.country}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">📍 City</span>
                  <span className="result-value">{result.city}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">⏰ Timezone</span>
                  <span className="result-value">{result.timezone}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">📋 Registrar</span>
                  <span className="result-value">{result.registrar}</span>
                </div>
              </div>
              <div className="result-raw">
                <h4>Raw JSON Output</h4>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </>
          )}
        {activeTab === 'password' && result && !result.error && (
            <>
              <div className="result-header">
                <h2>🔑 Password Analysis</h2>
                <span className="tag" style={{ background: result.color + '30', color: result.color }}>
                  {result.strength}
                </span>
              </div>

              <div className="password-meter">
                <div className="meter-bar">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${(result.score / result.maxScore) * 100}%`,
                      background: result.color
                    }}
                  />
                </div>
                <span style={{ color: result.color }}>{result.strength}</span>
              </div>

              <div className="result-grid">
                <div className="result-item">
                  <span className="result-label">📏 Length</span>
                  <span className="result-value">{result.length} characters</span>
                </div>
                <div className="result-item">
                  <span className="result-label">🔢 Entropy</span>
                  <span className="result-value">{result.entropy} bits</span>
                </div>
                <div className="result-item">
                  <span className="result-label">⏱️ Crack Time</span>
                  <span className="result-value" style={{ color: result.color }}>{result.crackTime}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">🚨 Breached</span>
                  <span className="result-value" style={{ color: result.breached ? '#f85149' : '#3fb950' }}>
                    {result.breached ? '⚠️ Yes - Change it!' : '✅ Not in common list'}
                  </span>
                </div>
              </div>

              <div className="password-checks">
                <h4>Character checks</h4>
                <div className="checks-grid">
                  {[
                    { label: 'Uppercase (A-Z)', value: result.hasUpper },
                    { label: 'Lowercase (a-z)', value: result.hasLower },
                    { label: 'Numbers (0-9)', value: result.hasNumber },
                    { label: 'Special chars', value: result.hasSpecial },
                    { label: '8+ characters', value: result.length >= 8 },
                    { label: '12+ characters', value: result.length >= 12 },
                  ].map((check, i) => (
                    <div key={i} className={`check-item ${check.value ? 'pass' : 'fail'}`}>
                      {check.value ? '✅' : '❌'} {check.label}
                    </div>
                  ))}
                </div>
              </div>

              {result.suggestions.length > 0 && (
                <div className="password-suggestions">
                  <h4>💡 Improvements</h4>
                  {result.suggestions.map((s, i) => (
                    <p key={i}>• {s}</p>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'email' && result && (
            <>
              {result.error ? (
                <p style={{ color: '#f85149' }}>❌ {result.error}</p>
              ) : (
                <>
                  <div className="result-header">
                    <h2>📧 Email Analysis: {result.email}</h2>
                    <span className={`tag ${result.isSuspicious ? 'tor' : 'clean'}`}>
                      {result.emailType}
                    </span>
                  </div>

                  <div className="result-grid">
                    <div className="result-item">
                      <span className="result-label">👤 Username</span>
                      <span className="result-value">{result.username}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">🌐 Domain</span>
                      <span className="result-value">{result.domain}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">📋 Type</span>
                      <span className="result-value">{result.emailType}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">⚠️ Suspicious</span>
                      <span className="result-value" style={{ color: result.isSuspicious ? '#f85149' : '#3fb950' }}>
                        {result.isSuspicious ? 'Yes - Disposable' : 'No'}
                      </span>
                    </div>
                  </div>

                  <div className="email-recommendation">
                    {result.recommendation}
                  </div>

                  <div className="osint-tips">
                    <h4>🕵️ OSINT Investigation Tips</h4>
                    <p className="osint-subtitle">Use these techniques to investigate this email further:</p>
                    {result.osintTips.map((tip, i) => (
                      <div key={i} className="osint-tip">
                        <code>{tip}</code>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      <div className="recon-learn">
        <h3>📚 What you're learning</h3>
        <div className="learn-grid">
          <div className="learn-item">
            <h4>🌐 IP Lookup</h4>
            <p>Geolocation, ISP identification, and VPN/proxy detection — used in threat intelligence and incident response.</p>
          </div>
          <div className="learn-item">
            <h4>📡 DNS Lookup</h4>
            <p>Resolve domain names to IP addresses — the first step in any web application reconnaissance.</p>
          </div>
          <div className="learn-item">
            <h4>🔍 Whois</h4>
            <p>Find domain registration info — used by pentesters to identify target infrastructure and ownership.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recon;