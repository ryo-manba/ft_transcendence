import type { NextPage } from 'next';
import { Layout } from 'components/common/Layout';
import { Display } from 'components/game/home/Display';
import { Header } from 'components/common/Header';

const Home: NextPage = () => {
  return (
    <Layout title="Game">
      <Header title="Game" />
      <Display />
    </Layout>
  );
};

export default Home;
