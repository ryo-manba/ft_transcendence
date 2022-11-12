import { NextPage } from 'next';
import { Setting } from 'components/game/play/Setting';
import { Play } from 'components/game/play/Play';
import { Result } from 'components/game/play/Result';
import { Layout } from 'components/game/home/Layout';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';

const Home: NextPage = () => {
  const { playState } = usePlayStateStore();
  console.log(playState);

  return (
    <Layout title="Play">
      {(playState === PlayState.stateSelecting ||
        playState === PlayState.stateStandingBy) && <Setting />}
      {playState === PlayState.statePlaying && <Play />}
      {(playState === PlayState.stateWinner ||
        playState === PlayState.stateLoser ||
        playState === PlayState.stateNothing) && <Result />}
    </Layout>
  );
};

export default Home;
