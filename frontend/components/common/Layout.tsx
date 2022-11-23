import Head from 'next/head';
import { FC, ReactNode } from 'react';

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
