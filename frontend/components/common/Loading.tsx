import { Grid, CircularProgress } from '@mui/material';

type Props = {
  fullHeight?: boolean;
};

export const Loading = ({ fullHeight = false }: Props) => {
  const height = fullHeight ? '100vh' : '100%';

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{ width: '100%', height: { height } }}
    >
      <Grid item>
        <CircularProgress />
      </Grid>
    </Grid>
  );
};
