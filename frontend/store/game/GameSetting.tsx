import { GameSetting } from 'types/game';
import create from 'zustand';

type State = {
  gameSetting: GameSetting;
  updateGameSetting: (payload: GameSetting) => void;
};

const defaultGameSetting: GameSetting = {
  difficulty: 'Easy',
  matchPoint: 3,
};

export const useGameSettingStore = create<State>((set) => ({
  gameSetting: defaultGameSetting,
  updateGameSetting: (payload) =>
    set({
      gameSetting: payload,
    }),
}));
