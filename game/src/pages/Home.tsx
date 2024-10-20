import React, { useState } from 'react';
import { RoomManager, UsernameForm } from '../Components';

const Home: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-600 to-purple-800">


      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 w-full">
        <div className="bg-black bg-opacity-50 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-2xl transition-all duration-300 hover:bg-opacity-60">
          {username ? (
            <div className="space-y-6 text-center">
              <p className="text-2xl text-white font-bold">Welcome, {username}!</p>
              <p className="text-lg text-gray-300">Join or create a room to start playing!</p>
              <RoomManager username={username} />
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <p className="text-2xl text-white font-bold">Enter a username to get started!</p>
              <UsernameForm onUsernameSet={setUsername} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-4 text-center bg-black bg-opacity-20">
        <p className="text-sm text-gray-300">&copy; 2024 Guessing Game. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;