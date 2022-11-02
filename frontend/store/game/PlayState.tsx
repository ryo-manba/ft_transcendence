import create from 'zustand';

const stateNothing = 0;
const stateWaiting = 1;
const statePlaying = 2;
const stateWinner = 3;
const stateLoser = 4;

type PlayState =
  | typeof stateNothing
  | typeof stateWaiting
  | typeof statePlaying
  | typeof stateWinner
  | typeof stateLoser;

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

export {
  stateNothing,
  stateWaiting,
  statePlaying,
  stateWinner,
  stateLoser,
  type PlayState,
};
