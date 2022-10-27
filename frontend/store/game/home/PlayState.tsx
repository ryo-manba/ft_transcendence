import create from 'zustand';

const stateNothing = 0;
const stateWaiting = 1;
const statePlaying = 2;

type PlayState =
  | typeof stateNothing
  | typeof stateWaiting
  | typeof statePlaying;

type State = {
  playState: PlayState;
  updatePlayState: (payload: PlayState) => void;
};

export const usePlayStateStore = create<State>((set) => ({
  playState: stateNothing,
  updatePlayState: (payload) =>
    set({
      playState: payload,
    }),
}));

export { stateNothing, stateWaiting, statePlaying, type PlayState };
