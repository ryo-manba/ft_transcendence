import { IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from './Loading';
import { logout } from 'api/auth/logout';
import { useRouter } from 'next/router';
import { useSocketStore } from 'store/game/ClientSocket';

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
  const { socket } = useSocketStore();

  if (user === undefined) return <Loading />;

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
        <MenuItem
          onClick={() => {
            socket.disconnect();
            logout(queryClient, router, session);
          }}
        >
          Logout
        </MenuItem>
      </Menu>
    </div>
  );
};
