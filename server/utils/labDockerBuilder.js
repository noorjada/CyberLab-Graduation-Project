const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { normalizeDockerfile } = require('./dockerfileNormalize');

const execFileAsync = promisify(execFile);

const LABS_ROOT = path.join(__dirname, '..', 'docker-labs');

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;

const FORBIDDEN_DOCKER_PATTERNS = [
  /--privileged/i,
  /cap-add\s*=\s*all/i,
  /CAP_SYS_ADMIN/i,
  /host\s*network/i,
  /network_mode\s*=\s*host/i,
  /-v\s+\/:/i,
  /volumes:\s*\n\s*-\s*\/:/i,
  /curl\s+.*\|\s*bash/i,
  /wget\s+.*\|\s*sh/i
];

function validateSlug(slug) {
  if (!slug || !SLUG_RE.test(slug)) {
    throw new Error('Slug must be lowercase letters, numbers, and hyphens (max 48 chars)');
  }
}

function validateDockerfile(content) {
  if (!content?.trim()) throw new Error('Dockerfile is required');
  if (!/^FROM\s+/im.test(content)) throw new Error('Dockerfile must start with FROM');

  for (const pattern of FORBIDDEN_DOCKER_PATTERNS) {
    if (pattern.test(content)) {
      throw new Error(`Dockerfile contains disallowed pattern: ${pattern}`);
    }
  }

  return true;
}

function validateFilePath(slug, relativePath) {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  if (normalized.includes('..') || path.isAbsolute(normalized)) {
    throw new Error(`Invalid file path: ${relativePath}`);
  }
  const full = path.join(LABS_ROOT, slug, normalized);
  const root = path.join(LABS_ROOT, slug) + path.sep;
  if (!full.startsWith(root) && full !== root.slice(0, -1)) {
    throw new Error(`Path escapes lab directory: ${relativePath}`);
  }
  return normalized;
}

async function writeLabFiles(slug, files) {
  validateSlug(slug);
  const baseDir = path.join(LABS_ROOT, slug);
  await fs.mkdir(baseDir, { recursive: true });

  const written = [];
  for (const file of files) {
    const rel = validateFilePath(slug, file.path || 'Dockerfile');
    let fileContent = file.content;
    if (rel === 'Dockerfile') {
      fileContent = normalizeDockerfile(fileContent);
      validateDockerfile(fileContent);
    }
    const fullPath = path.join(baseDir, rel);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, fileContent, 'utf8');
    written.push(rel);
  }

  if (!written.includes('Dockerfile')) {
    throw new Error('files must include a Dockerfile');
  }

  return { dir: baseDir, files: written };
}

async function buildLabImage(slug, imageName) {
  validateSlug(slug);
  const labDir = path.join(LABS_ROOT, slug);

  try {
    await fs.access(path.join(labDir, 'Dockerfile'));
  } catch {
    throw new Error(`No Dockerfile found for lab "${slug}"`);
  }

  const { stdout, stderr } = await execFileAsync(
    'docker',
    ['build', '-t', imageName, labDir],
    {
      timeout: 300000,
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true
    }
  );

  return {
    success: true,
    log: `${stdout || ''}\n${stderr || ''}`.trim()
  };
}

async function listLabFiles(slug) {
  validateSlug(slug);
  const baseDir = path.join(LABS_ROOT, slug);

  async function walk(dir, prefix = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const out = [];
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...await walk(full, rel));
      } else {
        const content = await fs.readFile(full, 'utf8');
        out.push({ path: rel, content });
      }
    }
    return out;
  }

  try {
    return await walk(baseDir);
  } catch {
    return [];
  }
}

async function removeLabFiles(slug) {
  validateSlug(slug);
  const baseDir = path.join(LABS_ROOT, slug);
  await fs.rm(baseDir, { recursive: true, force: true });
}

async function removeDockerImage(imageName) {
  try {
    await execFileAsync('docker', ['rmi', '-f', imageName], { timeout: 60000, windowsHide: true });
  } catch {
    // image may be in use or missing
  }
}

module.exports = {
  validateSlug,
  validateDockerfile,
  writeLabFiles,
  buildLabImage,
  listLabFiles,
  removeLabFiles,
  removeDockerImage,
  LABS_ROOT
};
