import { Grid , CircularProgress } from '@mui/material';

export const Loading = () => {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{ width: '100%', height: '100%' }}
    >
      <Grid item>
        <CircularProgress />
      </Grid>
    </Grid>
  );
};
