import { IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export const MenuButton = () => {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = () => {
    if (session) {
      void signOut();
    } else {
      queryClient.removeQueries(['user']);
      void axios.post(
        `${process.env.NEXT_PUBLIC_API_URL as string}/auth/logout`,
      );
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
        <Link href="/profile">
          <MenuItem>Profile</MenuItem>
        </Link>
        <MenuItem onClick={handleClose}>Setting</MenuItem>
        <MenuItem onClick={logout}>Logout</MenuItem>
      </Menu>
    </div>
  );
};
