export type AuthForm = {
  email: string;
  password: string;
  username?: string;
};

export type AxiosErrorResponse = {
  statusCode: number;
  message: string[] | string;
  error: string;
};
