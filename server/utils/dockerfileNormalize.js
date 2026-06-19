/**
 * Fix common AI-generated Dockerfile mistakes so docker build succeeds.
 */
const { fixPhpInDockerfile } = require('./phpDockerFix');

function buildPyWrite(target, body) {
  const safeTarget = target.replace(/\\/g, '/');
  return `RUN python3 - << 'PYEOF'
content = r"""${body}"""
open('${safeTarget}', 'w').write(content)
PYEOF`;
}

function parseRunEchoBlock(text, startIdx) {
  const slice = text.slice(startIdx);
  const header = slice.match(/^RUN\s+echo\s+/i);
  if (!header) return null;

  const qStart = header[0].length;
  const quote = slice[qStart];
  if (quote !== '"' && quote !== "'") return null;

  let body = '';
  let i = qStart + 1;
  while (i < slice.length) {
    const ch = slice[i];
    if (ch === '\\' && i + 1 < slice.length) {
      body += slice[i] + slice[i + 1];
      i += 2;
      continue;
    }
    if (ch === quote) {
      const tail = slice.slice(i + 1);
      const dest = tail.match(/^\s*>\s*(\S+)/);
      if (dest) {
        const endIdx = startIdx + i + 1 + dest[0].length;
        return { body, target: dest[1], endIdx, startIdx };
      }
    }
    body += ch;
    i++;
  }
  return null;
}

function normalizeDockerfile(content) {
  let c = String(content || '').replace(/\r\n/g, '\n').trim();
  if (!c) return c;

  // Fix AI typo: ?>" / ?>"  before open() — close python r""" string correctly
  c = c.replace(/\?>\s*"+(\s*\nopen\s*\()/g, '?>"""$1');

  if (/php:.*-apache/i.test(c) && !/python3-minimal|apt-get install -y python3/i.test(c)) {
    c = c.replace(
      /(FROM\s+php[^\n]+\n)/i,
      `$1RUN apt-get update && apt-get install -y python3-minimal && rm -rf /var/lib/apt/lists/*\n`
    );
  }

  // Convert every RUN echo "..." > file (including multiline HTML/PHP) to python heredoc
  let safety = 0;
  while (safety++ < 30) {
    const runEchoIdx = c.search(/RUN\s+echo\s+["']/i);
    if (runEchoIdx === -1) break;

    const block = parseRunEchoBlock(c, runEchoIdx);
    if (!block) break;

    const needsConvert =
      block.body.includes('\n') ||
      block.body.includes('<') ||
      block.body.includes('<?php') ||
      block.body.includes('script');

    if (!needsConvert && !block.body.includes('$')) {
      break;
    }

    const replacement = buildPyWrite(block.target, block.body);
    c = c.slice(0, block.startIdx) + replacement + c.slice(block.endIdx);
  }

  // Any remaining multiline RUN echo — force convert
  safety = 0;
  while (safety++ < 10) {
    const m = c.match(/RUN\s+echo\s+["'][\s\S]*?\n[\s\S]*?["']\s*>\s*\S+/i);
    if (!m) break;
    const block = parseRunEchoBlock(c, m.index);
    if (!block) break;
    c = c.slice(0, block.startIdx) + buildPyWrite(block.target, block.body) + c.slice(block.endIdx);
  }

  c = fixPhpInDockerfile(c);
  return ensureExpose(c);
}

function ensureExpose(content) {
  if (/php:.*-apache/i.test(content) && !/EXPOSE\s+80/i.test(content)) {
    return `${content.trim()}\nEXPOSE 80`;
  }
  return content;
}

module.exports = { normalizeDockerfile, parseRunEchoBlock, buildPyWrite };
