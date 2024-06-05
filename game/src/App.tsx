import React, { useState, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Page, RoomPage } from './Components';
import Cookies from 'js-cookie';

type GuestContextType = {
   guestName: string;
   setGuestName: React.Dispatch<React.SetStateAction<string>>;
   guestId: string;
   setGuestId: React.Dispatch<React.SetStateAction<string>>;
};

export const GuestContext = createContext<GuestContextType>({
   guestName: '',
   setGuestName: () => {},
   guestId: '',
   setGuestId: () => {},
});

function App() {
   const [guestName, setGuestName] = useState<string>(
      () => Cookies.get('guestName') || '',
   );
   const [guestId, setGuestId] = useState<string>(
      () => Cookies.get('guestId') || '',
   );

   useEffect(() => {
      Cookies.set('guestName', guestName);
      Cookies.set('guestId', guestId);
   }, [guestName, guestId]);

   return (
      <GuestContext.Provider
         value={{ guestName, setGuestName, guestId, setGuestId }}
      >
         <Router>
            <Routes>
               <Route path="/" element={<Page />} />
               <Route path="/room/:roomId" element={<RoomPage />} />
            </Routes>
         </Router>
      </GuestContext.Provider>
   );
}

export default App;