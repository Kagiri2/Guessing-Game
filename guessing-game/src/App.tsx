import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Page } from './Components';

type GuestContextType = {
  guestName: string;
  setGuestName: React.Dispatch<React.SetStateAction<string>>;
};

export const GuestContext = createContext<GuestContextType>({
  guestName: '',
  setGuestName: () => {}, 
});

function App() {
  const [guestName, setGuestName] = useState<string>('');

  return (
    <GuestContext.Provider value={{ guestName, setGuestName }}>
      <Router>
        <Routes>
          <Route path="/" element={<Page />} />
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </GuestContext.Provider>
  );
}

export default App;