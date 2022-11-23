import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { MenuButton } from './MenuButton';

type Props = {
  title: string;
};

// titleがbarの左側に表示されます
export const Header = ({ title }: Props) => {
  return (
    <AppBar position="static">
      <Toolbar style={{ justifyContent: 'space-between' }}>
        <Typography>{title}</Typography>
        <MenuButton />
      </Toolbar>
    </AppBar>
  );
};
