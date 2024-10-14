import React from 'react';

const Home: React.FC = () => {
  const handleJoinRoom = () => {
    // TODO: Implement join room logic
    console.log('Joining room...');
  };

  const handleCreateRoom = () => {
    // TODO: Implement create room logic
    console.log('Creating room...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">Guessing Game</h1>
        <p className="text-lg mb-8 text-gray-600">Join or create a room to start playing!</p>
        <div className="flex space-x-4">
          <button
            onClick={handleJoinRoom}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Join Room
          </button>
          <button
            onClick={handleCreateRoom}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;