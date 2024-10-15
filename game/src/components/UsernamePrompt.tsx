import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface UsernamePromptProps {
  onUsernameSet: (username: string) => void;
}

const UsernamePrompt: React.FC<UsernamePromptProps> = ({ onUsernameSet }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ username })
      .select()
      .single();

    if (error) {
      setError('Error creating user. Please try a different username.');
      return;
    }

    localStorage.setItem('username', username);
    onUsernameSet(username);
  };

  return (
    <div className="p-4 bg-white rounded shadow-md w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-4">Enter Your Username</h2>
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="border-2 border-gray-300 rounded px-2 py-1 w-full"
        />
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full"
        >
          Join Game
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
};

export default UsernamePrompt;