import { io, Socket } from 'socket.io-client';
import create from 'zustand';

type State = {
  socket: Socket | null;
  updateSocket: (payload: string) => void;
};

export const useSocketStore = create<State>((set) => ({
  socket: null,
  updateSocket: (payload) => {
    set({
      socket: io(payload),
    });
  },
}));
