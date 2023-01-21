export type ChatUser = {
  id: number;
  name: string;
};

export type ChatMessage = {
  roomId: number;
  text: string;
  userName: string;
  createdAt: Date;
};

export type CurrentRoom = {
  id: number;
  name: string;
};
