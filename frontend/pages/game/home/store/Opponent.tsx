import create from 'zustand';

type State = {
  opponent: string;
  updateOpponent: (payload: string) => void;
};

const useOpponentStore = create<State>((set) => ({
  opponent: '',
  updateOpponent: (payload) => {
    set({
      opponent: payload,
    });
  },
}));

export default useOpponentStore;
