import { NextPage } from 'next';
import { Play } from 'components/game/play/Play';
import { Winner } from 'components/game/play/Winner';
import { Loser } from 'components/game/play/Loser';
import { Error } from 'components/game/play/Error';
import { Layout } from 'components/game/home/Layout';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';

const Home: NextPage = () => {
  const { playState } = usePlayStateStore();
  console.log(playState);

  return (
    <Layout title="Play">
      {playState === PlayState.statePlaying && <Play />}
      {playState === PlayState.stateWinner && <Winner />}
      {playState === PlayState.stateLoser && <Loser />}
      {playState === PlayState.stateNothing && <Error />}
    </Layout>
  );
};

export default Home;
