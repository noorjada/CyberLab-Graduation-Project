const enrichLab = (lab) => {
  const tasks = lab.tasks || [];
  const base = (lab.flag || 'FLAG{main}').replace(/^FLAG\{/, '').replace(/\}$/, '');

  const flags = lab.flags?.length && lab.flags.some(f => f.flag && f.flag !== 'FLAG{change_me}')
    ? lab.flags
    : tasks.map((task, i) => ({
        key: `flag_${i + 1}`,
        label: task.title,
        flag: i === tasks.length - 1
          ? lab.flag
          : `FLAG{${base}_step${i + 1}}`,
        points: task.points || Math.floor((lab.points || 100) / Math.max(tasks.length, 1)),
        order: i + 1
      }));

  if (!flags.length && lab.flag) {
    flags.push({
      key: 'main',
      label: 'Main Flag',
      flag: lab.flag,
      points: lab.points || 100,
      order: 1
    });
  }

  const hints = lab.hints?.length
    ? lab.hints
    : tasks.map(t => t.hint).filter(Boolean);

  while (hints.length < 3) {
    hints.push(
      hints.length === 0
        ? `Start by exploring the ${lab.category || 'lab'} environment with basic enumeration.`
        : `Use recommended tools: ${(lab.tools || []).join(', ') || 'CLI and browser'}`
    );
  }

  const walkthrough = lab.walkthrough?.content
    ? lab.walkthrough
    : {
        content: `${lab.title} — step-by-step solution.\n\n${lab.description}`,
        steps: tasks.map((t, i) => `${i + 1}. ${t.title}: ${t.hint || t.description}`),
        tools: lab.tools || [],
        author: 'CyberLab Team'
      };

  return {
    ...lab,
    flags,
    hints: hints.slice(0, 5),
    hintCosts: (lab.hintCosts || [0, 15, 30, 45, 60]).slice(0, Math.min(5, hints.length)),
    walkthrough
  };
};

module.exports = { enrichLab };
