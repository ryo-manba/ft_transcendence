export interface Msg {
  message: string;
}
export interface Csrf {
  csrfToken: string;
}
export interface LoginResult {
  res: string;
  userId: number | undefined;
}

// service-controller間の型
export interface LoginInfo {
  accessToken: string;
  has2fa: boolean;
  userId: number | undefined;
}
