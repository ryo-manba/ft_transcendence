export type AuthForm = {
  username: string;
  password: string;
};

export type AxiosErrorResponse = {
  statusCode: number;
  message: string[] | string;
  error: string;
};

export type LoginResult = {
  res: LoginResultStatus;
  userId: number | undefined;
  errorMessage?: string;
};

export const LoginResultStatus = {
  SUCCESS: 'success',
  NEED2FA: 'need2fa',
  FAILURE: 'failure',
} as const;

export type LoginResultStatus =
  typeof LoginResultStatus[keyof typeof LoginResultStatus];

export const AvatarFontSize = {
  SMALL: '1.5rem',
  MEDIUM: '3rem',
  LARGE: '5rem',
} as const;

export type AvatarFontSize = typeof AvatarFontSize[keyof typeof AvatarFontSize];
