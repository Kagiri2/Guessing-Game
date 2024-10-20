import React, { useState } from 'react';
import { RoomManager, UsernameForm } from '../Components';

const Home: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-500 to-purple-700">
      {/* Header */}
      <header className="bg-white bg-opacity-20 p-4 shadow-md w-full">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center tracking-wide">
          Guessing Game
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-[90%] transition-transform transform hover:scale-105 duration-300">
          {username ? (
            <div className="space-y-6 text-center">
              <p className="text-2xl text-gray-800 font-bold">Welcome, {username}!</p>
              <p className="text-lg text-gray-600">Join or create a room to start playing!</p>
              <RoomManager username={username} />
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <p className="text-2xl text-gray-800 font-bold">Enter a username to get started!</p>
              <UsernameForm onUsernameSet={setUsername} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white bg-opacity-20 p-4 text-center shadow-inner w-full">
        <p className="text-sm text-white">&copy; 2024 Guessing Game. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;