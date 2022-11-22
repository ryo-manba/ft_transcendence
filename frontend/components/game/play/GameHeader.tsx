import { Grid } from '@mui/material';

type GameHeaderProps = {
  maxWidth: number;
  left: string | number;
  center: string | number;
  right: string | number;
};

export const GameHeader = (props: GameHeaderProps) => {
  return (
    <Grid container maxWidth={props.maxWidth}>
      <Grid
        container
        item
        xs={5}
        direction="row"
        alignItems="center"
        justifyContent="center"
      >
        <h2>{props.left}</h2>
      </Grid>
      <Grid
        container
        item
        xs={2}
        direction="row"
        alignItems="center"
        justifyContent="center"
      >
        <h2>{props.center}</h2>
      </Grid>
      <Grid
        container
        item
        xs={5}
        direction="row"
        alignItems="center"
        justifyContent="center"
      >
        <h2>{props.right}</h2>
      </Grid>
    </Grid>
  );
};
