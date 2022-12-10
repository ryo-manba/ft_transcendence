import { IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from './Loading';

export const MenuButton = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const router = useRouter();
  const { data: user } = useQueryUser();

  if (user === undefined) return <Loading />;

  const logout = () => {
    void axios.post(
      `${process.env.NEXT_PUBLIC_API_URL as string}/auth/logout`,
      {
        id: user.id,
      },
    );
    queryClient.removeQueries(['user']);
    if (session) {
      void signOut();
    } else {
      void router.push('/');
    }
  };

  return (
    <div>
      <IconButton
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <Link href="/dashboard">
          <MenuItem>Home</MenuItem>
        </Link>
        <Link href={{ pathname: '/profile', query: { userId: user.id } }}>
          <MenuItem>Profile</MenuItem>
        </Link>
        <Link href="/setting">
          <MenuItem>Setting</MenuItem>
        </Link>
        <MenuItem onClick={logout}>Logout</MenuItem>
      </Menu>
    </div>
  );
};
