import create from 'zustand';

enum PlayState {
  stateNothing,
  stateWaiting,
  stateSelecting,
  stateStandingBy,
  statePlaying,
  stateWinner,
  stateLoser,
}

type State = {
  playState: PlayState;
  updatePlayState: (payload: PlayState) => void;
};

export const usePlayStateStore = create<State>((set) => ({
  playState: PlayState.stateNothing,
  updatePlayState: (payload) =>
    set({
      playState: payload,
    }),
}));

export { PlayState };
