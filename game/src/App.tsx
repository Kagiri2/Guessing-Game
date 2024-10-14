import React from 'react'; // Ensure React is imported
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Game, Home } from './Components';

const App = () => {
  return (
    <Router>
      <div className="bg-gray-100 h-screen flex items-center justify-center flex-col">
        <h1 className="text-2xl font-bold text-center mb-4">Guessing Game</h1>
        <p className="text-lg text-center mb-4">Welcome to the Guessing Game! Try to guess the correct answer.</p>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:roomCode" element={<Game />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;