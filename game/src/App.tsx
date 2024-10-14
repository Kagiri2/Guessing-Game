import React from 'react';
import Game from './components/Game';

const App = () => {
  return (
    <div className="bg-gray-100 h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold text-center mb-4">Guessing Game</h1>
      <Game />
    </div>
  );
};

export default App;