function updateLevel(user) {
  const points = user.points || 0;
  if (points >= 1000) user.level = 5;
  else if (points >= 500) user.level = 4;
  else if (points >= 250) user.level = 3;
  else if (points >= 100) user.level = 2;
  else user.level = 1;
}

function hasBadge(user, name) {
  return (user.badges || []).some(b => b.name === name);
}

function awardBadge(user, name, description) {
  if (hasBadge(user, name)) return false;
  user.badges.push({ name, description });
  return true;
}

module.exports = { updateLevel, hasBadge, awardBadge };
