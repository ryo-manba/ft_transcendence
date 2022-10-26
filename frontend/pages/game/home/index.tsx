import type { NextPage } from 'next';
import Layout from '../../../components/game/home/Layout';
import Display from '../../../components/game/home/Display';

const Home: NextPage = () => {
  return (
    <Layout title="Matching">
      <Display />
    </Layout>
  );
};

export default Home;
