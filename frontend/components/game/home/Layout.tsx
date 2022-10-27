import Head from 'next/head';
import { FC, ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
};

export const Layout: FC<Props> = ({ children, title = 'Next.js' }) => {
  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      {/* <main style={{ backgroundImage: `url(${Image.src})` }}>{children}</main> */}
      <main>{children}</main>
    </div>
  );
};
