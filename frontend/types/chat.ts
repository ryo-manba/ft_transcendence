export type Chatroom = {
  id: number;
  name: string;
  type: string;
  ownerId: number;
  hashedPassword?: string;
};

export type CreateChatroom = {
  name: string;
  type: string;
  ownerId: number;
  hashedPassword?: string;
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
