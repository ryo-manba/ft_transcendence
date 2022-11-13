export type AuthForm = {
  email: string;
  password: string;
};

const difficultyLevelArray = ['Easy', 'Normal', 'Hard'];

export type DifficultyLevel = typeof difficultyLevelArray[number];

export const isDifficultyLevel = (value: unknown): value is DifficultyLevel => {
  return typeof value === 'string' && difficultyLevelArray.includes(value);
};

export type GameSetting = {
  difficulty: DifficultyLevel;
  matchPoint: number;
};
