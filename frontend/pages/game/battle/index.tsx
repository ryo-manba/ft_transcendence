import { NextPage } from 'next';
import { Setting } from 'components/game/battle/Setting';
import { Play } from 'components/game/battle/Play';
import { Result } from 'components/game/battle/Result';
import { Layout } from 'components/common/Layout';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { FinishedGameInfo } from 'types/game';
import { useState } from 'react';

const defaultFinishedGameInfo: FinishedGameInfo = {
  winnerName: '',
  loserName: '',
  winnerScore: 0,
  loserScore: 0,
};

const Battle: NextPage = () => {
  const { playState } = usePlayStateStore();
  const [finishedGameInfo, setFinishedGameInfo] = useState(
    defaultFinishedGameInfo,
  );

  return (
    <Layout title="Play">
      {(playState === PlayState.stateSelecting ||
        playState === PlayState.stateStandingBy) && <Setting />}
      {playState === PlayState.statePlaying && (
        <Play updateFinishedGameInfo={setFinishedGameInfo} />
      )}
      {(playState === PlayState.stateFinished ||
        playState === PlayState.stateCanceled ||
        playState === PlayState.stateNothing) && (
        <Result finishedGameInfo={finishedGameInfo} />
      )}
    </Layout>
  );
};

export default Battle;
