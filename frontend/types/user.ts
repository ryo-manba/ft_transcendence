// frontendで受け取るUser型は、hashedPasswordなど不要なものを取り除いたClientUser型として扱う。
// backend/src/user/types/user.tsと型を合わせること
export type ClientUser = {
  id: number;
  name: string;
  point: number;
  avatarPath?: string;
  status: UserStatus;
  has2FA: boolean;
  oAuthId?: string;
};
