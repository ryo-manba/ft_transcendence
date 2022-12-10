import { io, Socket } from 'socket.io-client';
import create from 'zustand';

type State = {
  socket: Socket;
};

export const useSocketStore = create<State>(() => ({
  socket: io('ws://localhost:3001/game'),
}));
