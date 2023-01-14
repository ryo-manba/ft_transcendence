export type SettingForm = {
  username: string;
};

export type TwoAuthForm = {
  authCode: string;
};

export const OpenSnackState = {
  NONE: 'NONE',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
} as const;

export type OpenSnackState = typeof OpenSnackState[keyof typeof OpenSnackState];
