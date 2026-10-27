export const LEVEL_BASE_XP = 100;
export const LEVEL_GROWTH_RATE = 1.22;

export type LevelProgress = {
  level: number;
  title: string;
  totalXp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
};

const levelTitles = ["Viajante iniciante", "Explorador", "Estrategista", "Navegador", "Especialista", "Mestre das milhas"];

export function getLevelTitle(level: number) {
  return levelTitles[Math.min(level, levelTitles.length - 1)];
}

export function getLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let level = 0;
  let xpSpent = 0;
  let xpToNextLevel = LEVEL_BASE_XP;

  while (safeXp >= xpSpent + xpToNextLevel) {
    xpSpent += xpToNextLevel;
    level += 1;
    xpToNextLevel = Math.round(LEVEL_BASE_XP * Math.pow(LEVEL_GROWTH_RATE, level));
  }

  const xpIntoLevel = safeXp - xpSpent;
  return {
    level,
    title: getLevelTitle(level),
    totalXp: safeXp,
    xpIntoLevel,
    xpToNextLevel,
    progressPercent: Math.min(100, Math.round((xpIntoLevel / xpToNextLevel) * 100)),
  };
}
