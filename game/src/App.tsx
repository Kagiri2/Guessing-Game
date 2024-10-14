import React from 'react';
import { Game, Home } from './Components';


const App = () => {
  return (
    <div className="bg-gray-100 h-screen flex items-center justify-center flex-col"> {/* Added flex-col to stack items vertically */}
      <h1 className="text-2xl font-bold text-center mb-4">Guessing Game</h1>
      <p className="text-lg text-center mb-4">Welcome to the Guessing Game! Try to guess the correct answer.</p> {/* Added text here */}
      <Home />
    </div>
  );
};

export default App;