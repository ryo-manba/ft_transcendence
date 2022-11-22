import type { NextPage } from 'next';
import { Layout } from 'components/game/home/Layout';
import { Display } from 'components/game/home/Display';
import { Header } from 'components/common/Header';

const Home: NextPage = () => {
  return (
    <Layout title="Matching">
      <Header title="Game" />
      <Display />
    </Layout>
  );
};

export default Home;
