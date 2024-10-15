import React, { useState } from 'react';
import { RoomManager, UsernameForm } from '../Components';

const Home: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col">
      <header className="bg-white bg-opacity-10 p-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">Guessing Game</h1>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md">
          {username ? (
            <div className="space-y-6">
              <p className="text-xl text-gray-800 font-semibold">Welcome, {username}!</p>
              <p className="text-lg text-gray-600">Join or create a room to start playing!</p>
              <RoomManager username={username} />
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xl text-gray-800 font-semibold">Enter a username to get started!</p>
              <UsernameForm onUsernameSet={setUsername} />
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-white bg-opacity-10 p-4 text-center">
        <p className="text-sm text-white">&copy; 2024 Guessing Game. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;