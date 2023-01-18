// appBarを除いた画面の高さを指定するコンポーネント
const appBarHeight = '64px';

export const ChatHeightStyle = () => {
  return {
    height: `calc(100vh - ${appBarHeight})`,
  };
};
