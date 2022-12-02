import { useQueryUser } from 'hooks/useQueryUser';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC, ReactNode } from 'react';
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
  const router = useRouter();
  if (router.pathname !== '/') {
    const { isSuccess } = useQueryUser();
    if (!isSuccess) return <Loading fullHeight />;
  }

  return (
    <div className={divClassName}>
      <Head>
        <title>{title}</title>
      </Head>
      {/* <main style={{ backgroundImage: `url(${Image.src})` }}>{children}</main> */}
      <main className={mainClassName}>{children}</main>
    </div>
  );
};
