import { GameGuest } from 'components/common/GameGuest';
import { useQueryUser } from 'hooks/useQueryUser';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { Friend } from 'types/friend';
import { SocketAuth } from 'types/game';
import { Loading } from './Loading';

type Props = {
  title: string;
  children: ReactNode;
};

export const Layout: FC<Props> = ({ children, title = 'Next.js' }) => {
  // ログインしてなければLoadingを表示
  const router = useRouter();
  const { socket: gameSocket } = useSocketStore();
  const [hosts, setHosts] = useState<Friend[]>([]);
  const { data: user, isSuccess } = useQueryUser();
  const showGuestPaths = useMemo(() => ['/game/home', '/dashboard'], []);

  useEffect(() => {
    let ignore = false;
    if (user === undefined) return;

    if (gameSocket.disconnected) {
      const socketAuth = { userId: user.id } as SocketAuth;
      gameSocket.auth = socketAuth;
      gameSocket.connect();
    }
    if (showGuestPaths.includes(router.pathname)) {
      gameSocket.emit(
        'getInvitedList',
        { userId: user.id },
        (newHosts: Friend[]) => {
          if (!ignore) {
            setHosts(newHosts);
          }
        },
      );
    }

    return () => {
      ignore = true;
    };
  }, [user, gameSocket, router.pathname, showGuestPaths]);

  useEffect(() => {
    if (!showGuestPaths.includes(router.pathname)) return;

    gameSocket.on('inviteFriend', (data: Friend) => {
      setHosts([...hosts.filter((elem) => elem.id !== data.id), data]);
    });
    gameSocket.on('cancelInvitation', (data: number) => {
      setHosts(hosts.filter((elem) => elem.id !== data));
    });

    return () => {
      gameSocket.off('inviteFriend');
      gameSocket.off('cancelInvitation');
    };
  }, [hosts, gameSocket, router.pathname, showGuestPaths]);

  if (router.pathname !== '/' && !isSuccess) {
    return <Loading fullHeight />;
  }

  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      {/* <main style={{ backgroundImage: `url(${Image.src})` }}>{children}</main> */}
      {hosts.length !== 0 && <GameGuest hosts={hosts} setHosts={setHosts} />}
      <main>{children}</main>
    </div>
  );
};
