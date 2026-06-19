const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'challenges');

const ALLOWED_EXTENSIONS = new Set([
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.pcap', '.pcapng', '.cap',
  '.txt', '.pdf', '.csv', '.json', '.xml', '.log',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp',
  '.bin', '.raw', '.img', '.iso', '.mem', '.dmp',
  '.html', '.md'
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_FILES = 10;

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(UPLOAD_ROOT);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const challengeId = req.params.id || 'draft';
    const dir = path.join(UPLOAD_ROOT, challengeId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const stored = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, stored);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type not allowed: ${ext}`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES }
});

const deleteChallengeFiles = (challengeId) => {
  const dir = path.join(UPLOAD_ROOT, challengeId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

const deleteStoredFile = (challengeId, storedName) => {
  const filePath = path.join(UPLOAD_ROOT, challengeId, storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  upload,
  UPLOAD_ROOT,
  MAX_FILES,
  MAX_FILE_SIZE,
  deleteChallengeFiles,
  deleteStoredFile,
  ALLOWED_EXTENSIONS: [...ALLOWED_EXTENSIONS]
};
