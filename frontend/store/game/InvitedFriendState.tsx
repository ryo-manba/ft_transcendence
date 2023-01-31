import { create } from 'zustand';

type InvitedFriendState = {
  friendId: number | null;
};

type State = {
  invitedFriendState: InvitedFriendState;
  updateInvitedFriendState: (payload: InvitedFriendState) => void;
};

export const useInvitedFriendStateStore = create<State>((set) => ({
  invitedFriendState: { friendId: null },
  updateInvitedFriendState: (payload: InvitedFriendState) => {
    set({ invitedFriendState: payload });
  },
}));

export type { InvitedFriendState };
