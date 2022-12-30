export type Chatroom = {
  id: number;
  name: string;
  type: ChatroomType;
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
  chatroomId: number;
  type: ChatroomType;
  password?: string;
};

export type Message = {
  ChatroomId: number;
  userId: number;
  message: string;
};

export const ChatroomType = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  PROTECTED: 'PROTECTED',
  DM: 'DM',
} as const;

export type ChatroomType = typeof ChatroomType[keyof typeof ChatroomType];

export const ChatroomSetting = {
  DELETE_ROOM: 'Delete Room',
  LEAVE_ROOM: 'Leave Room',
  ADD_FRIEND: 'Add Friend', // private room
  CHANGE_PASSWORD: 'Change Password', // protected room
  SET_ADMIN: 'Set Admin',
  MUTE_USER: 'Mute User',
  BAN_USER: 'Ban User',
} as const;

export type ChatroomSetting =
  typeof ChatroomSetting[keyof typeof ChatroomSetting];

export type ChatUser = {
  id: number;
  name: string;
};
