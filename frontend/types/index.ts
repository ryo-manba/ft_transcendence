export type AuthForm = {
  username: string;
  password: string;
};

export type AxiosErrorResponse = {
  statusCode: number;
  message: string[] | string;
  error: string;
};
