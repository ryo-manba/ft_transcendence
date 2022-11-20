import { NextPage } from 'next';
import { Setting } from 'components/game/battle/Setting';
import { Play } from 'components/game/battle/Play';
import { Result } from 'components/game/battle/Result';
import { Layout } from 'components/common/Layout';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { GameSetting } from 'types/game';
import { useState } from 'react';

const defaultGameSetting: GameSetting = {
  difficulty: 'Easy',
  matchPoint: 3,
};

const Battle: NextPage = () => {
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

export default Battle;
