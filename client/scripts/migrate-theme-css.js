/**
 * One-time helper: map legacy GitHub-dark hex colors to theme CSS variables.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const SKIP = new Set(['theme.css']);

const REPLACEMENTS = [
  [/#0d1117\b/gi, 'var(--card-bg)'],
  [/#161b22\b/gi, 'var(--bg-elevated)'],
  [/#131a24\b/gi, 'var(--bg-secondary)'],
  [/#21262d\b/gi, 'var(--border)'],
  [/#30363d\b/gi, 'var(--border-light)'],
  [/#8b949e\b/gi, 'var(--text-secondary)'],
  [/#c9d1d9\b/gi, 'var(--text-primary)'],
  [/#e0e0e0\b/gi, 'var(--text-primary)'],
  [/#58a6ff\b/gi, 'var(--accent-blue)'],
  [/#1f6feb\b/gi, 'var(--accent-blue)'],
  [/#388bfd\b/gi, 'var(--accent-blue)'],
  [/#3fb950\b/gi, 'var(--success)'],
  [/#238636\b/gi, 'var(--success)'],
  [/#2ea043\b/gi, 'var(--success)'],
  [/#f85149\b/gi, 'var(--danger)'],
  [/#da3633\b/gi, 'var(--danger)'],
  [/#f0c040\b/gi, 'var(--warning)'],
  [/#ff9800\b/gi, 'var(--warning)'],
  [/#0d2a1a\b/gi, 'var(--diff-easy-bg)'],
  [/#2d2a00\b/gi, 'var(--diff-medium-bg)'],
  [/#2d0a0a\b/gi, 'var(--diff-hard-bg)'],
  [/#1f6feb20\b/gi, 'var(--accent-blue-dim)'],
  [/#1f6feb40\b/gi, 'var(--accent-blue-dim)'],
  [/#1f6feb44\b/gi, 'var(--accent-blue-dim)'],
  [/#3fb95040\b/gi, 'color-mix(in srgb, var(--success) 35%, transparent)'],
  [/#3fb95055\b/gi, 'color-mix(in srgb, var(--success) 40%, transparent)'],
  [/#3fb95010\b/gi, 'var(--success-dim)'],
  [/#23863615\b/gi, 'var(--success-dim)'],
  [/#23863622\b/gi, 'var(--success-dim)'],
  [/#f0c04022\b/gi, 'var(--warning-dim)'],
  [/#f0c04055\b/gi, 'color-mix(in srgb, var(--warning) 40%, transparent)'],
  [/#f0c04030\b/gi, 'color-mix(in srgb, var(--warning) 30%, transparent)'],
  [/#f0c04015\b/gi, 'var(--warning-dim)'],
  [/#1f6feb10\b/gi, 'var(--accent-blue-dim)'],
  [/#1f6feb15\b/gi, 'var(--accent-blue-dim)'],
  [/#1f6feb18\b/gi, 'var(--accent-blue-dim)'],
  [/#1f6feb22\b/gi, 'var(--accent-blue-dim)'],
  [/#1f6feb30\b/gi, 'var(--accent-blue-dim)'],
  [/#1f6feb55\b/gi, 'color-mix(in srgb, var(--accent-blue) 40%, transparent)'],
  [/#1f6feb08\b/gi, 'var(--accent-blue-dim)'],
  [/#3fb95020\b/gi, 'var(--success-dim)'],
  [/#3fb95033\b/gi, 'color-mix(in srgb, var(--success) 30%, transparent)'],
  [/#3fb95044\b/gi, 'color-mix(in srgb, var(--success) 35%, transparent)'],
  [/#3fb95050\b/gi, 'color-mix(in srgb, var(--success) 40%, transparent)'],
  [/#f8514922\b/gi, 'var(--danger-dim)'],
  [/#f8514930\b/gi, 'var(--danger-dim)'],
  [/#f8514940\b/gi, 'var(--danger-dim)'],
  [/#f8514955\b/gi, 'color-mix(in srgb, var(--danger) 40%, transparent)'],
  [/#f8514920\b/gi, 'var(--danger-dim)'],
  [/#f0c04020\b/gi, 'var(--warning-dim)'],
  [/#f0c04033\b/gi, 'color-mix(in srgb, var(--warning) 30%, transparent)'],
  [/#f0c04040\b/gi, 'color-mix(in srgb, var(--warning) 35%, transparent)'],
  [/#2d1500\b/gi, 'var(--warning-dim)'],
  [/#2d1a00\b/gi, 'var(--warning-dim)'],
  [/#0d2a4a\b/gi, 'var(--accent-blue-dim)'],
  [/#e6edf3\b/gi, 'var(--text-primary)'],
  [/#6e7681\b/gi, 'var(--text-muted)'],
  [/#4a5568\b/gi, 'var(--text-muted)'],
  [/#bc8cff\b/gi, 'var(--accent-purple)'],
  [/#a78bfa\b/gi, 'var(--accent-purple)'],
  [/#1c2128\b/gi, 'var(--bg-elevated)'],
  [/#1f2937\b/gi, 'var(--bg-hover)'],
  [/#9e6a03\b/gi, 'var(--warning)'],
  [/#bb8009\b/gi, 'var(--warning)'],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.css')) files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(SRC)) {
  if (SKIP.has(path.basename(file))) continue;
  let content = fs.readFileSync(file, 'utf8');
  const before = content;
  for (const [re, rep] of REPLACEMENTS) {
    content = content.replace(re, rep);
  }
  if (content !== before) {
    fs.writeFileSync(file, content);
    changed++;
    console.log('updated:', path.relative(SRC, file));
  }
}
console.log(`Done. ${changed} files updated.`);
