import { io, Socket } from 'socket.io-client';
import create from 'zustand';

type State = {
  socket: Socket;
};

// ページ遷移の際にdisconnectしてconnectしなおしてくれない時がある。
export const useSocketStore = create<State>(() => ({
  socket: io('ws://localhost:3001/game', {
    autoConnect: false,
  }),
}));
