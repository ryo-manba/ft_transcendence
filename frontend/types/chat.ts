export type Chatroom = {
  id: number;
  name: string;
  type: ChatroomType;
  ownerId: number;
};

export type CurrentRoom = {
  id: number;
  name: string;
  type: ChatroomType;
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
  roomId: number;
  text: string;
  userId: number;
  userName: string;
  createdAt: Date;
};

export const ChatroomType = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  PROTECTED: 'PROTECTED',
  DM: 'DM',
} as const;

export type ChatroomType = (typeof ChatroomType)[keyof typeof ChatroomType];

export const ChatroomSetting = {
  DELETE_ROOM: 'Delete Room',
  LEAVE_ROOM: 'Leave Room',
  ADD_FRIEND: 'Add Friend', // private room
  CHANGE_PASSWORD: 'Change Password', // protected room
  SET_ADMIN: 'Set Admin',
  MUTE_USER: 'Mute User',
  UNMUTE_USER: 'Unmute User',
  BAN_USER: 'Ban User',
  UNBAN_USER: 'Unban User',
  ADD_PASSWORD: 'Add Password',
} as const;

export type ChatroomSetting =
  (typeof ChatroomSetting)[keyof typeof ChatroomSetting];

export type ChatUser = {
  id: number;
  name: string;
};

export const ChatBlockSetting = {
  BLOCK_USER: 'Block User',
  UNBLOCK_USER: 'Unblock User',
} as const;

export type ChatBlockSetting =
  (typeof ChatBlockSetting)[keyof typeof ChatBlockSetting];
