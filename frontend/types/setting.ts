export type SettingForm = {
  username: string;
};

export type TwoAuthForm = {
  authCode: string;
};

const openSnackState: readonly string[] = ['NONE', 'SUCCESS', 'ERROR'] as const;

export type OpenSnackState = typeof openSnackState[number];
