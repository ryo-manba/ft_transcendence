import { ReactNode, memo } from 'react';
import { Box, Collapse } from '@mui/material';

type Props = {
  show: boolean;
  children: ReactNode;
};

export const ChatAlertCollapse = memo(function ChatAlertCollapse({
  show,
  children,
}: Props) {
  return (
    <Box sx={{ width: '100%' }}>
      <Collapse in={show}>{children}</Collapse>
    </Box>
  );
});
