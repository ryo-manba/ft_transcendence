import { Grid, Typography } from '@mui/material';

type GameHeaderProps = {
  maxWidth: number;
  left: string | number;
  center: string | number;
  right: string | number;
};

export const GameHeader = (props: GameHeaderProps) => {
  return (
    <Grid container maxWidth={props.maxWidth} wrap="nowrap" sx={{ pt: 2 }}>
      <Grid
        container
        item
        xs={5}
        direction="row"
        alignItems="center"
        justifyContent="center"
        zeroMinWidth
      >
        <Typography variant="h5" noWrap align="center">
          {props.left}
        </Typography>
      </Grid>
      <Grid
        container
        item
        xs={2}
        direction="row"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="h5" noWrap align="center">
          {props.center}
        </Typography>
      </Grid>
      <Grid
        container
        item
        xs={5}
        direction="row"
        alignItems="center"
        justifyContent="center"
        zeroMinWidth
      >
        <Typography variant="h5" noWrap align="center">
          {props.right}
        </Typography>
      </Grid>
    </Grid>
  );
};
