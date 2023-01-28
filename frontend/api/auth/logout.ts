import axios from 'axios';
import { signOut } from 'next-auth/react';
import { QueryClient } from '@tanstack/react-query';
import { Session } from 'next-auth';
import { NextRouter } from 'next/router';
import { ClientUser } from 'types/user';

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/auth/logout`;

export const logout = (
  queryClient: QueryClient,
  router: NextRouter,
  session: Session | null,
) => {
  const logout = async () => {
    const cachedUser = queryClient.getQueryData<ClientUser>(['user']);
    if (cachedUser) {
      await axios.post(endpoint, {
        id: cachedUser.id,
      });
      queryClient.removeQueries(['user']);
      if (session) {
        await signOut();
      } else {
        await router.push('/');
      }
    }
  };

  void logout();
};
