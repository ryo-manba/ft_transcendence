import type { NextPage } from 'next';
import { Layout } from './components/Layout';
import { Display } from './components/Display';

const Home: NextPage = () => {
  return (
    <Layout title="Matching">
      <Display />
    </Layout>
  );
};

export default Home;
