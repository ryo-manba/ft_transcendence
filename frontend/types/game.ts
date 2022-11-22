const difficultyLevelArray: readonly string[] = [
  'Easy',
  'Normal',
  'Hard',
] as const;

export type DifficultyLevel = typeof difficultyLevelArray[number];

export const isDifficultyLevel = (value: unknown): value is DifficultyLevel => {
  return typeof value === 'string' && difficultyLevelArray.includes(value);
};

export type GameSetting = {
  difficulty: DifficultyLevel;
  matchPoint: number;
};
