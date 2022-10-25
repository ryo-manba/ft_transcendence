import { useState, useCallback, useEffect, useContext } from 'react';
import useOpponentStore from '../store/Opponent';
import { Context } from './Display';

export const Play = () => {
  const [score, setScore] = useState(0);
  const clientSocket = useContext(Context);
  const { opponent } = useOpponentStore();

  const arrowFunc = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === 'ArrowUp') {
        console.log('up button pushed');
        clientSocket.socket?.emit('playScore', 1);
      } else if (event.code === 'ArrowDown') {
        console.log('down button pushed');
        clientSocket.socket?.emit('playScore', -1);
      }
    },
    [clientSocket.socket],
  );

  useEffect(() => {
    document.addEventListener('keydown', arrowFunc, false);

    clientSocket.socket?.on('playScored', (arg: number) => {
      setScore((score) => score + arg);
    });
  }, [clientSocket.socket]);

  return (
    <div>
      <h2>YOU VS {opponent}</h2>
      <h1 className="text-center">{score}</h1>
    </div>
  );
};
