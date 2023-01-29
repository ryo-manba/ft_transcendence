export type ChatUser = {
  id: number;
  name: string;
};

export type ChatMessage = {
  roomId: number;
  text: string;
  userId: number;
  userName: string;
  createdAt: Date;
};
