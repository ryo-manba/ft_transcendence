import Link from 'next/link';
import IconButton from '@mui/material/IconButton';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';

type Props = {
  title: string;
};

// titleがbarの左側に表示されます
export const Header = ({ title }: Props) => {
  return (
    <AppBar position="static">
      <Toolbar style={{ justifyContent: 'space-between' }}>
        <Typography>{title}</Typography>
        <Link href="/">
          <IconButton aria-label="home">
            <HomeIcon />
          </IconButton>
        </Link>
      </Toolbar>
    </AppBar>
  );
};
