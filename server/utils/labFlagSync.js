const { enrichLab } = require('./labEnrichment');

function extractFlagsFromDockerfile(dockerfile) {
  if (!dockerfile) return [];
  const matches = [...String(dockerfile).matchAll(/FLAG\{[^}\r\n]+\}/g)].map(m => m[0]);
  return [...new Set(matches)];
}

function resolveMainFlag(draft, dockerfile) {
  const extracted = extractFlagsFromDockerfile(dockerfile);
  const draftFlag = draft.flag?.trim();

  if (draftFlag && draftFlag !== 'FLAG{change_me}') {
    return draftFlag;
  }
  if (extracted.length) {
    return extracted[extracted.length - 1];
  }
  return draftFlag || 'FLAG{change_me}';
}

/**
 * Align DB flags with what's actually inside the Docker image.
 * Single FLAG in Dockerfile → one main objective (most AI web labs).
 */
function resolveLabFlags(draft) {
  const dockerfile = (draft.files || []).find(f => f.path === 'Dockerfile')?.content || '';
  const extracted = extractFlagsFromDockerfile(dockerfile);
  const mainFlag = resolveMainFlag(draft, dockerfile);
  const points = parseInt(draft.points, 10) || 100;

  if (extracted.length <= 1) {
    return {
      flag: mainFlag,
      flags: [{
        key: 'main',
        label: 'Main Flag',
        flag: mainFlag,
        points,
        order: 1
      }]
    };
  }

  // Multiple distinct flags in Dockerfile — map to tasks when possible
  const enriched = enrichLab({
    ...draft,
    flag: mainFlag,
    flags: extracted.map((f, i) => ({
      key: `flag_${i + 1}`,
      label: draft.tasks?.[i]?.title || `Flag ${i + 1}`,
      flag: f,
      points: draft.tasks?.[i]?.points || Math.floor(points / extracted.length),
      order: i + 1
    }))
  });

  return { flag: mainFlag, flags: enriched.flags };
}

module.exports = {
  extractFlagsFromDockerfile,
  resolveMainFlag,
  resolveLabFlags
};
