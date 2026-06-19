const express = require('express');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const vtLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many requests, please wait a minute.' }
});

// Scan a URL
router.post('/url', auth, vtLimiter, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    const formData = new URLSearchParams();
    formData.append('url', url);

    const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': process.env.VIRUSTOTAL_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const submitText = await submitResponse.text();
    console.log('VT Submit response:', submitText);
    const submitData = JSON.parse(submitText);

    if (!submitData.data) {
      return res.status(400).json({ message: 'Failed to submit URL' });
    }

    const analysisId = submitData.data.id;

    await new Promise(resolve => setTimeout(resolve, 3000));

    const resultResponse = await fetch(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      {
        headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY }
      }
    );

    const resultData = await resultResponse.json();
    const stats = resultData.data?.attributes?.stats;

    if (!stats) {
      return res.status(400).json({ message: 'Analysis not ready, try again' });
    }

    const results = resultData.data?.attributes?.results || {};
    const detections = Object.entries(results)
      .filter(([, v]) => v.category === 'malicious')
      .map(([engine, data]) => ({ engine, result: data.result }));

    res.json({
      url,
      stats,
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      detections,
      verdict: stats.malicious > 0 ? 'MALICIOUS' :
        stats.suspicious > 0 ? 'SUSPICIOUS' : 'CLEAN'
    });

  } catch (err) {
    console.error('VirusTotal error:', err);
    res.status(500).json({ message: 'VirusTotal service unavailable' });
  }
});

// Scan an IP
router.get('/ip/:ip', auth, vtLimiter, async (req, res) => {
  try {
    const { ip } = req.params;

    const response = await fetch(
      `https://www.virustotal.com/api/v3/ip_addresses/${ip}`,
      {
        headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY }
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: data.error.message });
    }

    const attrs = data.data?.attributes;
    const stats = attrs?.last_analysis_stats;

    res.json({
      ip,
      country: attrs?.country || 'Unknown',
      asOwner: attrs?.as_owner || 'Unknown',
      reputation: attrs?.reputation || 0,
      malicious: stats?.malicious || 0,
      suspicious: stats?.suspicious || 0,
      harmless: stats?.harmless || 0,
      undetected: stats?.undetected || 0,
      total: stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0,
      verdict: (stats?.malicious || 0) > 0 ? 'MALICIOUS' :
        (stats?.suspicious || 0) > 0 ? 'SUSPICIOUS' : 'CLEAN'
    });

  } catch (err) {
    console.error('VirusTotal error:', err);
    res.status(500).json({ message: 'VirusTotal service unavailable' });
  }
});

// Scan a domain
router.get('/domain/:domain', auth, vtLimiter, async (req, res) => {
  try {
    const { domain } = req.params;

    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${domain}`,
      {
        headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY }
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: data.error.message });
    }

    const attrs = data.data?.attributes;
    const stats = attrs?.last_analysis_stats;

    res.json({
      domain,
      registrar: attrs?.registrar || 'Unknown',
      reputation: attrs?.reputation || 0,
      malicious: stats?.malicious || 0,
      suspicious: stats?.suspicious || 0,
      harmless: stats?.harmless || 0,
      undetected: stats?.undetected || 0,
      total: stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0,
      categories: attrs?.categories || {},
      verdict: (stats?.malicious || 0) > 0 ? 'MALICIOUS' :
        (stats?.suspicious || 0) > 0 ? 'SUSPICIOUS' : 'CLEAN'
    });

  } catch (err) {
    console.error('VirusTotal error:', err);
    res.status(500).json({ message: 'VirusTotal service unavailable' });
  }
});

module.exports = router;