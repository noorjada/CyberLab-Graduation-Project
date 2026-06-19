const express      = require('express');
const PDFDocument  = require('pdfkit');
const auth         = require('../middleware/auth');
const {
  drawAdminSignature,
  drawPlatformSignature,
  prepareAdminSignatureImage
} = require('../utils/certificateSignature');
const Certificate  = require('../models/Certificate');
const User         = require('../models/User');
const LearningPath = require('../models/LearningPath');

const router = express.Router();

// ── GET /api/certificates/my ─────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const certs = await Certificate.find({ user: req.user.userId })
      .sort({ completedAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/certificates/claim/:pathId ─── create cert if path is complete
router.post('/claim/:pathId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const path = await LearningPath.findById(req.params.pathId);
    if (!path) return res.status(404).json({ message: 'Path not found' });

    // Check path is actually complete
    const allModuleIds  = path.modules.map(m => m._id.toString());
    const userModuleIds = (user.completedModules || []).map(id => id.toString());
    const isComplete    = allModuleIds.length > 0 && allModuleIds.every(id => userModuleIds.includes(id));
    if (!isComplete) return res.status(400).json({ message: 'Path not completed yet' });

    // Find or create
    let cert = await Certificate.findOne({ user: user._id, learningPath: path._id });
    if (!cert) {
      const totalXp = path.modules.reduce((s, m) => s + (m.xpReward || 0), 0);
      cert = await Certificate.create({
        user:           user._id,
        learningPath:   path._id,
        pathTitle:      path.title,
        pathTrack:      path.track,
        pathCareerPath: path.careerPath || 'general',
        pathIcon:       path.icon || '🛡️',
        xpEarned:       totalXp,
        totalModules:   path.modules.length
      });
      user.completedPaths = (user.completedPaths || 0) + 1;
      await user.save();
    }
    res.json(cert);
  } catch (err) {
    console.error('Claim cert error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/certificates/verify/:certId (public) ─────────────────
router.get('/verify/:certId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certId })
      .populate('user', 'username level points');
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/certificates/:certId/pdf ────────────────────────────
router.get('/:certId/pdf', auth, async (req, res) => {
  try {
    const cert = await Certificate.findOne({
      certificateId: req.params.certId,
      user: req.user.userId
    }).populate('user', 'username');

    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    const username  = cert.user?.username || 'Hacker';
    const filename  = `CyberLab-Certificate-${cert.certificateId.slice(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const adminSignature = await prepareAdminSignatureImage();

    const doc = buildPDF({
      username,
      pathTitle:      cert.pathTitle,
      pathTrack:      cert.pathTrack,
      pathCareerPath: cert.pathCareerPath,
      completedAt:    cert.completedAt,
      xpEarned:       cert.xpEarned,
      totalModules:   cert.totalModules,
      certificateId:  cert.certificateId,
      adminSignature
    });

    doc.pipe(res);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

// ── PDF builder ───────────────────────────────────────────────────
function buildPDF({
  username, pathTitle, pathTrack, pathCareerPath,
  completedAt, xpEarned, totalModules, certificateId, adminSignature
}) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 0, bottom: 0, left: 0, right: 0 } });

  const W = 841.89;
  const H = 595.28;

  // ── Dark background ──
  doc.rect(0, 0, W, H).fill('#0a0f1a');

  // ── Corner decorations ──
  const cs = 14;
  [[8, 8], [W - 8 - cs, 8], [8, H - 8 - cs], [W - 8 - cs, H - 8 - cs]]
    .forEach(([x, y]) => doc.rect(x, y, cs, cs).fill('#f0c040'));

  // ── Borders ──
  doc.rect(8, 8, W - 16, H - 16).lineWidth(2).stroke('#f0c040');
  doc.rect(15, 15, W - 30, H - 30).lineWidth(1).stroke('#1f6feb');

  // ── Header strip ──
  doc.rect(8, 8, W - 16, 66).fill('#0d1a2a');

  // ── Footer strip ──
  doc.rect(8, H - 58, W - 16, 50).fill('#0d1a2a');

  // ── Gold accent lines ──
  doc.moveTo(22, 74).lineTo(W - 22, 74).lineWidth(1.5).stroke('#f0c040');
  doc.moveTo(22, H - 60).lineTo(W - 22, H - 60).lineWidth(1.5).stroke('#f0c040');

  // ── HEADER: CyberLab title ──
  doc.fontSize(26).fillColor('#58a6ff').font('Helvetica-Bold')
     .text('CyberLab', 0, 16, { width: W, align: 'center' });

  doc.fontSize(10).fillColor('#8b949e').font('Helvetica')
     .text('Cybersecurity Training Platform', 0, 46, { width: W, align: 'center' });

  // ── Certificate of Achievement heading ──
  doc.fontSize(20).fillColor('#f0c040').font('Helvetica-Bold')
     .text('C E R T I F I C A T E   O F   A C H I E V E M E N T', 0, 88, { width: W, align: 'center' });

  // ── Decorative centered line under heading ──
  const lineW = 260;
  const lineX = (W - lineW) / 2;
  doc.moveTo(lineX, 118).lineTo(lineX + lineW, 118).lineWidth(1).stroke('#1f6feb');

  // ── "This is to certify that" ──
  doc.fontSize(12).fillColor('#8b949e').font('Helvetica')
     .text('This is to certify that', 0, 130, { width: W, align: 'center' });

  // ── Username ──
  doc.fontSize(34).fillColor('#ffffff').font('Helvetica-Bold')
     .text(username, 0, 152, { width: W, align: 'center' });

  // ── Underline under username ──
  const nameW = Math.min(doc.widthOfString(username, { fontSize: 34, font: 'Helvetica-Bold' }), 380);
  const nameX = (W - nameW) / 2;
  doc.moveTo(nameX, 196).lineTo(nameX + nameW, 196).lineWidth(2).stroke('#58a6ff');

  // ── "has successfully completed" ──
  doc.fontSize(12).fillColor('#8b949e').font('Helvetica')
     .text('has successfully completed the learning path', 0, 208, { width: W, align: 'center' });

  // ── Path title ──
  doc.fontSize(22).fillColor('#58a6ff').font('Helvetica-Bold')
     .text(pathTitle, 0, 232, { width: W, align: 'center' });

  // ── Track / Career / Modules ──
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const infoLine = `Track: ${cap(pathTrack)}   |   Career Path: ${cap(pathCareerPath)}   |   Modules Completed: ${totalModules}`;
  doc.fontSize(10).fillColor('#8b949e').font('Helvetica')
     .text(infoLine, 0, 270, { width: W, align: 'center' });

  // ── XP Earned ──
  doc.fontSize(13).fillColor('#f0c040').font('Helvetica-Bold')
     .text(`XP Earned: ${xpEarned}`, 0, 292, { width: W, align: 'center' });

  // ── Signature blocks ──
  const sigY = 388;
  const leftSigX = 100;
  const sigW = 260;
  const rightSigX = W - 100 - sigW;

  drawAdminSignature(doc, { sigX: leftSigX, sigY, sigW }, adminSignature);
  drawPlatformSignature(doc, { sigX: rightSigX, sigY, sigW });

  // ── Official seal (text-based circle) ──
  const sealX = W / 2;
  const sealY = 352;
  doc.circle(sealX, sealY, 38).lineWidth(2).stroke('#1f6feb');
  doc.circle(sealX, sealY, 32).lineWidth(1).stroke('#f0c040');
  doc.fontSize(9).fillColor('#58a6ff').font('Helvetica-Bold')
     .text('OFFICIAL', sealX - 22, sealY - 10)
     .text('SEAL', sealX - 11, sealY + 2);

  // ── Footer content ──
  const dateStr = new Date(completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const shortId = certificateId.slice(0, 18).toUpperCase();

  doc.fontSize(9).fillColor('#8b949e').font('Helvetica')
     .text(`Issued: ${dateStr}`, 35, H - 46)
     .text(`ID: ${shortId}`, 0, H - 46, { width: W - 35, align: 'right' });

  doc.end();
  return doc;
}

module.exports = router;
