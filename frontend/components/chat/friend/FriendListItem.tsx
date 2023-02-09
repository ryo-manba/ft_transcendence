import {
  useState,
  memo,
  useEffect,
  Dispatch,
  SetStateAction,
  useMemo,
} from 'react';
import { useRouter } from 'next/router';
import Debug from 'debug';
import { Socket } from 'socket.io-client';
import { ListItem, ListItemText, ListItemAvatar } from '@mui/material';
import { Friend } from 'types/friend';
import { GameSetting, GameState, Invitation, UserStatus } from 'types/game';
import { CurrentRoom, Chatroom } from 'types/chat';
import { useSocketStore } from 'store/game/ClientSocket';
import { useInvitedFriendStateStore } from 'store/game/InvitedFriendState';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { useQueryUser } from 'hooks/useQueryUser';
import { FriendInfoDialog } from 'components/chat/friend/FriendInfoDialog';
import { Loading } from 'components/common/Loading';
import { BadgedAvatar } from 'components/common/BadgedAvatar';
import { ChatErrorAlert } from 'components/chat/alert/ChatErrorAlert';
import { ChatAlertCollapse } from 'components/chat/alert/ChatAlertCollapse';
import { AvatarFontSize } from 'types/utils';
import { usePlayerNamesStore } from 'store/game/PlayerNames';
import { PlayState, usePlayStateStore } from 'store/game/PlayState';
import { useGameSettingStore } from 'store/game/GameSetting';

type Props = {
  friend: Friend;
  socket: Socket;
  setCurrentRoom: Dispatch<SetStateAction<CurrentRoom | undefined>>;
};

type FriendGameInfo = {
  player1Name: string;
  player2Name: string;
  gameState: GameState;
  gameSetting: GameSetting;
};

export const FriendListItem = memo(function FriendListItem({
  friend,
  socket,
  setCurrentRoom,
}: Props) {
  const debug = useMemo(() => Debug('friend'), []);
  const [open, setOpen] = useState(false);
  const [friendStatus, setFriendStatus] = useState<UserStatus>(
    UserStatus.OFFLINE,
  );
  const { data: user } = useQueryUser();
  const [error, setError] = useState('');
  const { socket: gameSocket } = useSocketStore();
  const updateInvitedFriendState = useInvitedFriendStateStore(
    (store) => store.updateInvitedFriendState,
  );
  const router = useRouter();
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updateGameSetting = useGameSettingStore(
    (store) => store.updateGameSetting,
  );

  useEffect(() => {
    let ignore = false;

    gameSocket.emit(
      'getUserStatusById',
      { userId: friend.id },
      (res: UserStatus) => {
        if (!ignore) {
          setFriendStatus(res);
        }
      },
    );

    gameSocket.on(
      'updateStatus',
      (data: { userId: number; status: UserStatus }) => {
        if (data.userId === friend.id) {
          setFriendStatus(data.status);
        }
      },
    );

    return () => {
      ignore = true;
      gameSocket.off('updateStatus');
    };
  }, [debug, friend.id, gameSocket]);

  if (user === undefined) {
    return <Loading />;
  }

  const inviteGame = (friend: Friend) => {
    if (friendStatus !== UserStatus.ONLINE) {
      setError(`${friend.name} is now ${friendStatus}`);

      return;
    }

    const invitation: Invitation = {
      guestId: friend.id,
      hostId: user.id,
    };

    gameSocket.emit('inviteFriend', invitation, (res: boolean) => {
      if (res) {
        updateInvitedFriendState({ friendId: friend.id });
        void router.push('game/home');
      } else {
        setError('You already started to play/prepare game');
      }
    });
  };

  const watchGame = (friend: Friend) => {
    if (friendStatus !== UserStatus.PLAYING) {
      setError(`${friend.name} is NOT playing a game now.`);

      return;
    }

    gameSocket.emit(
      'watchFriendGame',
      { friendId: friend.id },
      (res: { friendGameInfo: FriendGameInfo | undefined }) => {
        debug(res.friendGameInfo);

        if (res.friendGameInfo === undefined) {
          setError(`${friend.name} is NOT playing a game now.`);

          return;
        }
        const playerNames: [string, string] = [
          res.friendGameInfo.player1Name,
          res.friendGameInfo.player2Name,
        ];
        updatePlayerNames(playerNames);
        if (res.friendGameInfo.gameState === GameState.SETTING) {
          updatePlayState(PlayState.stateStandingBy);
        } else {
          updatePlayState(PlayState.statePlaying);
          updateGameSetting(res.friendGameInfo.gameSetting);
        }
        void router.push('/game/battle');
      },
    );
  };

  const directMessage = (friend: Friend) => {
    const DMInfo = {
      senderId: user.id,
      recipientId: friend.id,
      senderName: user.name,
      recipientName: friend.name,
    };
    socket.emit(
      'chat:directMessage',
      DMInfo,
      (res: { chatroom: Chatroom | undefined }) => {
        debug('chat:directMessage %o', res);
        if (!res.chatroom) {
          setError('Failed to start direct messages.');

          return;
        }

        const newCurrentRoom: CurrentRoom = {
          id: res.chatroom.id,
          name: res.chatroom.name,
          type: res.chatroom.type,
        };
        setCurrentRoom(newCurrentRoom);
      },
    );
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <ChatAlertCollapse show={error !== ''}>
        <ChatErrorAlert error={error} setError={setError} />
      </ChatAlertCollapse>
      <ListItem divider button onClick={handleClickOpen}>
        <ListItemAvatar>
          <BadgedAvatar
            status={friendStatus}
            src={getAvatarImageUrl(friend.id)}
            displayName={friend.name}
            avatarFontSize={AvatarFontSize.SMALL}
          />
        </ListItemAvatar>
        <ListItemText
          primary={friend.name}
          style={{
            overflow: 'hidden',
          }}
        />
      </ListItem>
      <FriendInfoDialog
        friend={friend}
        friendStatus={friendStatus}
        onClose={handleClose}
        open={open}
        inviteGame={inviteGame}
        watchGame={watchGame}
        directMessage={directMessage}
      />
    </>
  );
});
