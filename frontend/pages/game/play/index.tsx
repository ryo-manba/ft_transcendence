import { NextPage } from 'next';
import { Setting } from 'components/game/play/Setting';
import { Play } from 'components/game/play/Play';
import { Result } from 'components/game/play/Result';
import { Layout } from 'components/game/home/Layout';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { GameSetting } from 'types';
import { useState } from 'react';

const defaultGameSetting: GameSetting = {
  difficulty: 'Easy',
  matchPoint: 3,
};

const Home: NextPage = () => {
  const { playState } = usePlayStateStore();
  const [gameSetting, setGameSetting] = useState(defaultGameSetting);
  console.log(playState);

  return (
    <Layout title="Play">
      {(playState === PlayState.stateSelecting ||
        playState === PlayState.stateStandingBy) && (
        <Setting updateSetting={setGameSetting} />
      )}
      {playState === PlayState.statePlaying && (
        <Play gameSetting={gameSetting} />
      )}
      {(playState === PlayState.stateWinner ||
        playState === PlayState.stateLoser ||
        playState === PlayState.stateNothing) && <Result />}
    </Layout>
  );
};

export default Home;
