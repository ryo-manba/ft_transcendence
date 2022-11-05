import { NextPage } from 'next';
import { Play } from 'components/game/play/Play';
import { Winner } from 'components/game/play/Winner';
import { Loser } from 'components/game/play/Loser';
import { Layout } from 'components/game/home/Layout';
import {
  usePlayStateStore,
  statePlaying,
  stateWinner,
  stateLoser,
} from 'store/game/PlayState';

const Home: NextPage = () => {
  const { playState } = usePlayStateStore();
  console.log(playState);

  return (
    <Layout title="Play">
      {playState === statePlaying && <Play />}
      {playState === stateWinner && <Winner />}
      {playState === stateLoser && <Loser />}
    </Layout>
  );
};

export default Home;
