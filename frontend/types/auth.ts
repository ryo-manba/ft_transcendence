export type Image = {
  link: string;
};

export type UserInfo = {
  login: string;
  image: Image;
};

export type LoginInput = {
  oAuthId: string;
  imagePath: string;
};
