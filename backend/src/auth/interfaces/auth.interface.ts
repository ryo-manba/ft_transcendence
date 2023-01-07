export interface Msg {
  message: string;
}
export interface Csrf {
  csrfToken: string;
}
export interface LoginInfo {
  accessToken: string;
  has2fa: boolean;
}
