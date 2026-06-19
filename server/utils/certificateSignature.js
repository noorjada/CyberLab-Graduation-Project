const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DEFAULT_SIGNATURE_FILE = path.join(__dirname, '../assets/signatures/admin-signature.png');
const PROCESSED_CACHE = path.join(__dirname, '../assets/signatures/admin-signature-transparent.png');

function resolveSignaturePath() {
  const customPath = process.env.CERT_SIGNATURE_PATH;
  const candidates = [
    customPath,
    DEFAULT_SIGNATURE_FILE,
    path.join(__dirname, '../assets/signatures/admin-signature.jpg')
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) return resolved;
  }
  return null;
}

async function removeLightBackground(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = Number(process.env.CERT_SIGNATURE_BG_THRESHOLD) || 200;
  const softness = 35;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum >= threshold) {
      data[i + 3] = 0;
    } else if (lum >= threshold - softness) {
      data[i + 3] = Math.round(255 * (threshold - lum) / softness);
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();
}

async function prepareAdminSignatureImage() {
  const source = resolveSignaturePath();
  if (!source) return null;

  try {
    const srcStat = fs.statSync(source);

    if (fs.existsSync(PROCESSED_CACHE)) {
      const cacheStat = fs.statSync(PROCESSED_CACHE);
      if (cacheStat.mtimeMs >= srcStat.mtimeMs) {
        const buffer = fs.readFileSync(PROCESSED_CACHE);
        const meta = await sharp(buffer).metadata();
        return { buffer, width: meta.width, height: meta.height };
      }
    }

    const buffer = await removeLightBackground(source);
    fs.writeFileSync(PROCESSED_CACHE, buffer);
    const meta = await sharp(buffer).metadata();
    return { buffer, width: meta.width, height: meta.height };
  } catch (err) {
    console.error('Signature processing failed:', err.message);
    const buffer = fs.readFileSync(source);
    const meta = await sharp(buffer).metadata();
    return { buffer, width: meta.width, height: meta.height };
  }
}

function getCertificateSigner() {
  return {
    title: process.env.CERT_ADMIN_TITLE || 'Founder & Administrator, CyberLab',
    signaturePath: resolveSignaturePath()
  };
}

function drawAdminSignature(doc, { sigX, sigY, sigW }, signatureImage) {
  const { title } = getCertificateSigner();
  const maxW = sigW;
  const maxH = 82;

  if (signatureImage?.buffer) {
    const { buffer, width, height } = signatureImage;
    const scale = Math.min(maxW / width, maxH / height);
    const drawW = width * scale;
    const drawH = height * scale;
    const imgX = sigX + (sigW - drawW) / 2;
    const imgY = sigY - drawH - 4;

    doc.image(buffer, imgX, imgY, { width: drawW, height: drawH });
  }

  doc.moveTo(sigX, sigY).lineTo(sigX + sigW, sigY).lineWidth(1).stroke('#30363d');

  doc.fontSize(9).fillColor('#8b949e').font('Helvetica')
    .text(title, sigX, sigY + 8, { width: sigW, align: 'center' });
}

function drawPlatformSignature(doc, { sigX, sigY, sigW }) {
  const centerX = sigX + sigW / 2;
  const markY = sigY - 50;

  const badgeY = markY + 8;
  doc.moveTo(centerX, badgeY - 11)
    .lineTo(centerX + 11, badgeY - 3)
    .lineTo(centerX + 11, badgeY + 7)
    .lineTo(centerX, badgeY + 15)
    .lineTo(centerX - 11, badgeY + 7)
    .lineTo(centerX - 11, badgeY - 3)
    .closePath()
    .lineWidth(1.2)
    .stroke('#58a6ff');
  doc.fontSize(7).fillColor('#f0c040').font('Helvetica-Bold')
    .text('CL', centerX - 5, badgeY - 1, { lineBreak: false });

  doc.save();
  doc.moveTo(sigX + 18, markY + 32)
    .bezierCurveTo(sigX + 55, markY + 18, sigX + sigW - 55, markY + 40, sigX + sigW - 18, markY + 28)
    .lineWidth(1.8)
    .stroke('#f0c040');
  doc.restore();

  const brandY = markY + 38;
  doc.font('Helvetica-BoldOblique').fontSize(28);
  const cyberText = 'Cyber';
  const labText = 'Lab';
  const cyberW = doc.widthOfString(cyberText);
  const labW = doc.widthOfString(labText);
  const brandStartX = sigX + (sigW - cyberW - labW) / 2;

  doc.fillColor('#58a6ff').text(cyberText, brandStartX, brandY, { lineBreak: false });
  doc.fillColor('#f0c040').text(labText, brandStartX + cyberW, brandY, { lineBreak: false });

  doc.moveTo(sigX, sigY).lineTo(sigX + sigW, sigY).lineWidth(1).stroke('#30363d');

  doc.fontSize(9).fillColor('#8b949e').font('Helvetica')
    .text('Official Training Platform', sigX, sigY + 8, { width: sigW, align: 'center' });
}

module.exports = {
  getCertificateSigner,
  prepareAdminSignatureImage,
  drawAdminSignature,
  drawPlatformSignature
};
