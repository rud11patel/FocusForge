function getLevelFromXp(totalXp) {
  return Math.floor(Math.sqrt(totalXp / 50));
}

function getXpProgress(totalXp) {
  const currentLevel = getLevelFromXp(totalXp);
  const currentThreshold = currentLevel ** 2 * 50;
  const nextLevel = currentLevel + 1;
  const nextThreshold = nextLevel ** 2 * 50;

  return {
    currentLevel,
    currentXp: totalXp - currentThreshold,
    requiredXp: nextThreshold - currentThreshold,
    nextLevel,
  };
}

module.exports = { getLevelFromXp, getXpProgress };
