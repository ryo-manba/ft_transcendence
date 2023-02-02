import { GameSetting } from 'types/game';
import { create } from 'zustand';

type State = {
  gameSetting: GameSetting;
  updateGameSetting: (payload: GameSetting) => void;
};

const defaultGameSetting: GameSetting = {
  difficulty: 'Easy',
  matchPoint: 3,
  player1Score: 0,
  player2Score: 0,
};

export const useGameSettingStore = create<State>((set) => ({
  gameSetting: defaultGameSetting,
  updateGameSetting: (payload) =>
    set({
      gameSetting: payload,
    }),
}));
