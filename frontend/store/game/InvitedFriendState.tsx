import { Friend } from 'types/friend';
import create from 'zustand';

type InvitedFriendState = {
  friend: Friend;
  invitedFriend: boolean;
};

type State = {
  invitedFriendState: InvitedFriendState;
  updateInvitedFriendState: (payload: InvitedFriendState) => void;
};

export const useInvitedFriendStateStore = create<State>((set) => ({
  invitedFriendState: { friend: { id: 0, name: '' }, invitedFriend: false },
  updateInvitedFriendState: (payload: InvitedFriendState) => {
    set({ invitedFriendState: payload });
  },
}));

export type { InvitedFriendState };
