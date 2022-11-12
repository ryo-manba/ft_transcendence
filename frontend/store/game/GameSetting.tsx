import create from 'zustand';

type State = {
  gameSetting: [string, number];
  updateGameSetting: (payload: [string, number]) => void;
};

export const useGameSettingStore = create<State>((set) => ({
  gameSetting: ['Easy', 3],
  updateGameSetting: (payload) => {
    set({
      gameSetting: payload,
    });
  },
}));
