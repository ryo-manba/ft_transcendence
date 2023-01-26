import { ClientUser } from 'src/user/types/user';

declare module 'express-serve-static-core' {
  interface Request {
    user?: ClientUser;
  }
}
