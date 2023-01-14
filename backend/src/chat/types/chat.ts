export type ChatUser = {
  id: number;
  name: string;
};

export type ChatMessage = {
  text: string;
  userName: string;
  createdAt: Date;
};
