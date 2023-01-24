import { LoginUser } from 'src/user/types/user';

declare module 'express-serve-static-core' {
  interface Request {
    user?: LoginUser;
  }
}
