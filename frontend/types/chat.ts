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

export type JoinChatroomInfo = {
  userId: number;
  roomId: number;
  type: ChatroomType;
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
  DELETE_ROOM: 'Delete Room',
  ADD_FRIEND: 'Add Friend', // private room
  CHANGE_PASSWORD: 'Change Password', // protected room
  SET_ADMIN: 'Set Admin',
  MUTE_USER: 'Mute User',
  BAN_USER: 'Ban User',
} as const;

export type ChatroomSettings =
  typeof CHATROOM_SETTINGS[keyof typeof CHATROOM_SETTINGS];
