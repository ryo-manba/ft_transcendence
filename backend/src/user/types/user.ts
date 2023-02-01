import { User } from '@prisma/client';

// front側へ返す必要のない情報を取り除く
// frontend/types/user.tsと型を合わせること
type ExcludeProperties =
  | 'hashedPassword'
  | 'secret2FA'
  | 'createdAt'
  | 'updatedAt';

export type ClientUser = Omit<User, ExcludeProperties>;
