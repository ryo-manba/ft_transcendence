export type Chatroom = {
  id: number;
  name: string;
  type: string;
  ownerId: number;
  hashedPassword?: string;
};

export type CreateChatroomInfo = {
  name: string;
  type: string;
  ownerId: number;
  password?: string;
};

export type Message = {
  ChatroomId: number;
  userId: number;
  message: string;
};

export const CHATROOM_TYPE = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  PROTECTED: 'PROTECTED',
} as const;

export type ChatroomType = typeof CHATROOM_TYPE[keyof typeof CHATROOM_TYPE];

export const CHATROOM_SETTINGS = {
  DELETE_ROOM: 'Delete room',
  ADD_FRIEND: 'Add friend', // private room
  CHANGE_PASSWORD: 'Change password', // protected room
  SET_ADMIN: 'Set admin',
  MUTE_USER: 'Mute user',
  BAN_USER: 'Ban user',
} as const;

export type ChatroomSettings =
  typeof CHATROOM_SETTINGS[keyof typeof CHATROOM_SETTINGS];
