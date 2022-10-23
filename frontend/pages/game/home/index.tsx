import type { NextPage } from 'next';
import { Layout } from './components/Layout';
import { GameDisplay } from './components/Display';

const Home: NextPage = () => {
  return (
    <Layout title="Matching">
      <GameDisplay />
    </Layout>
  );
};

export default Home;
