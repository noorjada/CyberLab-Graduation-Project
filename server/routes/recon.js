const express = require('express');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const reconLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please wait a minute.' }
});

// IP lookup
router.get('/ip/:ip', auth, reconLimiter, async (req, res) => {
  try {
    const { ip } = req.params;

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip) && ip !== 'me') {
      return res.status(400).json({ message: 'Invalid IP address format' });
    }

    const response = await fetch(
      `https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`
    );

    if (!response.ok) {
      return res.status(400).json({ message: 'Failed to fetch IP info' });
    }

    const data = await response.json();

    res.json({
      ip: data.ip,
      hostname: data.hostname || 'N/A',
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country || 'Unknown',
      location: data.loc || 'N/A',
      org: data.org || 'Unknown',
      postal: data.postal || 'N/A',
      timezone: data.timezone || 'Unknown',
      isVPN: data.privacy?.vpn || false,
      isProxy: data.privacy?.proxy || false,
      isTor: data.privacy?.tor || false,
      isHosting: data.privacy?.hosting || false,
    });

  } catch (err) {
    console.error('IPInfo error:', err);
    res.status(500).json({ message: 'Recon service unavailable' });
  }
});

// DNS lookup simulation
router.get('/dns/:domain', auth, reconLimiter, async (req, res) => {
  try {
    const { domain } = req.params;

    const response = await fetch(
      `https://dns.google/resolve?name=${domain}&type=A`
    );

    const data = await response.json();

    if (data.Status !== 0 || !data.Answer) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    const records = data.Answer.map(record => ({
      name: record.name,
      type: record.type === 1 ? 'A' : record.type === 28 ? 'AAAA' : 'OTHER',
      ttl: record.TTL,
      data: record.data
    }));

    res.json({ domain, records });

  } catch (err) {
    console.error('DNS error:', err);
    res.status(500).json({ message: 'DNS lookup failed' });
  }
});

// Whois simulation
router.get('/whois/:domain', auth, reconLimiter, async (req, res) => {
  try {
    const { domain } = req.params;

    // Get IP for the domain first
    const dnsResponse = await fetch(
      `https://dns.google/resolve?name=${domain}&type=A`
    );
    const dnsData = await dnsResponse.json();

    let ipInfo = null;
    if (dnsData.Answer && dnsData.Answer.length > 0) {
      const ip = dnsData.Answer[0].data;
      const ipResponse = await fetch(
        `https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`
      );
      ipInfo = await ipResponse.json();
    }

    res.json({
      domain,
      registrar: 'See whois.domaintools.com for full details',
      ip: ipInfo?.ip || 'N/A',
      org: ipInfo?.org || 'N/A',
      country: ipInfo?.country || 'N/A',
      city: ipInfo?.city || 'N/A',
      timezone: ipInfo?.timezone || 'N/A'
    });

  } catch (err) {
    console.error('Whois error:', err);
    res.status(500).json({ message: 'Whois lookup failed' });
  }
});

module.exports = router;