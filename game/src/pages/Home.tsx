import React, { useState } from 'react';
import { RoomManager, UsernameForm } from '../Components';


const Home: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">Guessing Game</h1>
        {username ? (
          <>
            <p className="text-lg mb-8 text-gray-600">Welcome, {username}!</p>
            <p className="text-lg mb-8 text-gray-600">Join or create a room to start playing!</p>
            <RoomManager username={username} />
          </>
        ) : (
          <UsernameForm onUsernameSet={setUsername} />
        )}
      </div>
    </div>
  );
};

export default Home;