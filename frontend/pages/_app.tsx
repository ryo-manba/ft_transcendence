/* eslint-disable react/jsx-props-no-spreading */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import '../styles/globals.css';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import axios from 'axios';
import { SessionProvider } from 'next-auth/react';

import type { Session } from 'next-auth';
import { logout } from 'api/auth/logout';
import { useRouter } from 'next/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// backendのauth.interface.tsと同じ型を定義
export interface Csrf {
  csrfToken: string;
}

function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  axios.defaults.withCredentials = true; // Cookieのやりとりする時に必要
  const router = useRouter();
  useEffect(() => {
    // ロードされた時にCsrfトークンを取得するのでここで定義
    // ヘッダに自動的に付与される
    const getCsrfToken = async () => {
      if (process.env.NEXT_PUBLIC_API_URL) {
        const { data } = await axios.get<Csrf>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/csrf`,
        );
        axios.defaults.headers.common['csrf-token'] = data.csrfToken;
      }
    };
    void getCsrfToken();

    // ウィンドウを閉じた際に自動的にログアウトするためにEventListenerを設定
    const handleTabClose = (event: Event) => {
      event.preventDefault();
      logout(queryClient, router, session);
    };

    // 'unload'のイベントはウィンドウ閉じたときのみ発火
    // 'beforeunload'はページを更新したときにも発火
    window.addEventListener('unload', handleTabClose);

    return () => {
      window.removeEventListener('unload', handleTabClose);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default MyApp;
