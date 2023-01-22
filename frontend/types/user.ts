import { User } from '@prisma/client';

type ExcludeUserProperties = 'hashedPassword' | 'secret2FA';
export type LoginUser = Omit<User, ExcludeUserProperties>;
