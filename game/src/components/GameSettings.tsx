import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { GameType } from '../services/gameInterface';

interface GameSettingsProps {
  gameId: number;
  isLongestStandingPlayer: boolean;
}

const GameSettings: React.FC<GameSettingsProps> = ({ gameId, isLongestStandingPlayer }) => {
  const [gameSettings, setGameSettings] = useState<GameType | null>(null);
  const [targetScore, setTargetScore] = useState<number>(100);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchGameSettings();
  }, [gameId]);

  const fetchGameSettings = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) {
      console.error('Error fetching game settings:', error);
      setError('Failed to load game settings');
    } else if (data) {
      setGameSettings(data);
      setTargetScore(data.target_score);
      setTimeLimit(data.time_limit);
    }
  };

  const updateGameSettings = async () => {
    if (!isLongestStandingPlayer) {
      setError('Only the longest-standing player can change game settings');
      return;
    }

    const { data, error } = await supabase
      .from('games')
      .update({ target_score: targetScore, time_limit: timeLimit })
      .eq('id', gameId)
      .select();

    if (error) {
      console.error('Error updating game settings:', error);
      setError('Failed to update game settings');
    } else {
      setError('');
      setGameSettings(data[0]);
      // You might want to add a success message here
    }
  };

  if (!gameSettings) {
    return <div>Loading game settings...</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-2">Game Settings</h3>
      <div className="space-y-2">
        <div>
          <label htmlFor="targetScore" className="block">Target Score:</label>
          <input
            id="targetScore"
            type="number"
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!isLongestStandingPlayer}
          />
        </div>
        <div>
          <label htmlFor="timeLimit" className="block">Time Limit (seconds, 0 for no limit):</label>
          <input
            id="timeLimit"
            type="number"
            value={timeLimit === null ? 0 : timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value) || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!isLongestStandingPlayer}
          />
        </div>
        {isLongestStandingPlayer && (
          <button
            onClick={updateGameSettings}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Update Settings
          </button>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <div className="mt-4">
        <h4 className="font-semibold">Current Settings:</h4>
        <p>Target Score: {gameSettings.target_score}</p>
        <p>Time Limit: {gameSettings.time_limit ? `${gameSettings.time_limit} seconds` : 'No limit'}</p>
        <p>Game State: {gameSettings.state}</p>
      </div>
    </div>
  );
};

export default GameSettings;