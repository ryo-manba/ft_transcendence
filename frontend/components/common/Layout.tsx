import { Guest } from 'components/game/home/Guest';
import { useQueryUser } from 'hooks/useQueryUser';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC, ReactNode, useEffect, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { Friend } from 'types/friend';
import { Loading } from './Loading';

type Props = {
  title: string;
  children: ReactNode;
  divClassName?: string;
  mainClassName?: string;
};

export const Layout: FC<Props> = ({
  children,
  title = 'Next.js',
  divClassName = '',
  mainClassName = '',
}) => {
  // ログインしてなければLoadingを表示
  const router = useRouter();
  const { socket: gameSocket } = useSocketStore();
  const [hosts, setHosts] = useState<Friend[]>([]);
  const { data: user, isSuccess } = useQueryUser();

  useEffect(() => {
    if (
      user === undefined ||
      !['/game/home', '/dashboard'].includes(router.pathname)
    )
      return;

    gameSocket.emit('getInvitedLlist', user.id, (newHosts: Friend[]) => {
      setHosts([...hosts, ...newHosts]);
    });
    if (gameSocket.disconnected) gameSocket.connect();
  }, [user]);

  useEffect(() => {
    if (!['/game/home', '/dashboard'].includes(router.pathname)) return;

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
  });

  if (router.pathname !== '/' && !isSuccess) {
    return <Loading fullHeight />;
  }

  return (
    <div className={divClassName}>
      <Head>
        <title>{title}</title>
      </Head>
      {/* <main style={{ backgroundImage: `url(${Image.src})` }}>{children}</main> */}
      {hosts.length !== 0 && <Guest hosts={hosts} />}
      <main className={mainClassName}>{children}</main>
    </div>
  );
};
