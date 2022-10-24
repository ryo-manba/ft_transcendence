import type { NextPage } from 'next';
import Canvas from './Canvas';

const Home: NextPage = () => {
  return (
    <div>
      <Canvas width="1000" height="600" />
    </div>
  );
};

export default Home;
