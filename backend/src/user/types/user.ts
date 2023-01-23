import { User } from '@prisma/client';

// front側へ返す必要のない情報を取り除く
type ExcludeProperties = 'hashedPassword' | 'secret2FA';
export type LoginUser = Omit<User, ExcludeProperties>;
