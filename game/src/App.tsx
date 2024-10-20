import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Game, Home } from './Components';

const App = () => {
  return (
    <Router>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:roomCode" element={<Game />} />
        </Routes>

    </Router>
  );
};

export default App;