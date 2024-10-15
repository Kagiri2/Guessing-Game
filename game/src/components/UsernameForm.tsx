import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface UsernameFormProps {
  onUsernameSet: (username: string) => void;
}

const UsernameForm: React.FC<UsernameFormProps> = ({ onUsernameSet }) => {
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

    onUsernameSet(username);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter your username"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
      >
        Set Username
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
};

export default UsernameForm;