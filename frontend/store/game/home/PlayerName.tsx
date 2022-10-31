import create from 'zustand';

type State = {
  playerNames: [string, string];
  updatePlayerNames: (payload: [string, string]) => void;
};

export const usePlayerNamesStore = create<State>((set) => ({
  playerNames: ['', ''],
  updatePlayerNames: (payload) => {
    set({
      playerNames: payload,
    });
  },
}));
