import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { GameType } from '../services/gameInterface';

interface GameSettingsProps {
  gameId: number;
  isLongestStandingPlayer: boolean;
  onUpdateGame: (updatedGame: Partial<GameType>) => void;
  gameState: string;
}

interface Category {
  id: number;
  name: string;
}

const GameSettings: React.FC<GameSettingsProps> = ({ 
  gameId, 
  isLongestStandingPlayer, 
  onUpdateGame,
  gameState
}) => {
  const [gameSettings, setGameSettings] = useState<GameType | null>(null);
  const [targetScore, setTargetScore] = useState<number>(100);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const isGameInProgress = gameState === 'in_progress';

  const fetchGameSettings = useCallback(async () => {
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
      setSelectedCategoryId(data.category_id);
    }
  }, [gameId]);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } else if (data) {
      setCategories(data);
    }
  }, []);

  const fetchQuestionCount = useCallback(async (categoryId: number) => {
    const { count, error } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (error) {
      console.error('Error fetching question count:', error);
      setError('Failed to load question count');
    } else {
      setQuestionCount(count);
    }
  }, []);

  useEffect(() => {
    fetchGameSettings();
    fetchCategories();

    const gamesSubscription = supabase
      .channel(`public:games:id=eq.${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        handleGameChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesSubscription);
    };
  }, [gameId, fetchGameSettings, fetchCategories]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchQuestionCount(selectedCategoryId);
    } else {
      setQuestionCount(null);
    }
  }, [selectedCategoryId, fetchQuestionCount]);

  const handleGameChange = (payload: any) => {
    console.log("Game settings change:", payload);
    if (payload.new) {
      setGameSettings(prevSettings => ({ ...prevSettings, ...payload.new }));
      setTargetScore(payload.new.target_score);
      setTimeLimit(payload.new.time_limit);
      setSelectedCategoryId(payload.new.category_id);
      onUpdateGame(payload.new);
    }
  };

  const updateGameSettings = useCallback(async (updatedSettings: Partial<GameType>) => {
    if (!isLongestStandingPlayer || isGameInProgress) {
      setError('Settings cannot be changed at this time');
      return;
    }

    const { data, error } = await supabase
      .from('games')
      .update(updatedSettings)
      .eq('id', gameId)
      .select();

    if (error) {
      console.error('Error updating game settings:', error);
      setError('Failed to update game settings');
    } else {
      setError('');
      setGameSettings(data[0]);
      onUpdateGame(updatedSettings);
      console.log('Updated game settings:', updatedSettings);
    }
  }, [gameId, isLongestStandingPlayer, onUpdateGame, isGameInProgress]);

  const handleTargetScoreChange = (value: number) => {
    setTargetScore(value);
    updateGameSettings({ target_score: value });
  };

  const handleTimeLimitChange = (value: number | null) => {
    setTimeLimit(value);
    updateGameSettings({ time_limit: value === 0 ? null : value });
  };

  const handleCategoryChange = (value: number | null) => {
    setSelectedCategoryId(value);
    updateGameSettings({ category_id: value });
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
            onChange={(e) => handleTargetScoreChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!isLongestStandingPlayer || isGameInProgress}
          />
        </div>
        <div>
          <label htmlFor="timeLimit" className="block">Time Limit (seconds, 0 for no limit):</label>
          <input
            id="timeLimit"
            type="number"
            value={timeLimit === null ? 0 : timeLimit}
            onChange={(e) => handleTimeLimitChange(Number(e.target.value) || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!isLongestStandingPlayer || isGameInProgress}
          />
        </div>
        <div>
          <label htmlFor="category" className="block">Category:</label>
          <select
            id="category"
            value={selectedCategoryId || ''}
            onChange={(e) => handleCategoryChange(Number(e.target.value) || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!isLongestStandingPlayer || isGameInProgress}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {questionCount !== null && (
            <p className="mt-1 text-sm text-gray-600">
              Number of questions in this category: {questionCount}
            </p>
          )}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <div className="mt-4">
        <h4 className="font-semibold">Current Settings:</h4>
        <p>Target Score: {gameSettings.target_score}</p>
        <p>Time Limit: {gameSettings.time_limit ? `${gameSettings.time_limit} seconds` : 'No limit'}</p>
        <p>Category: {categories.find(c => c.id === gameSettings.category_id)?.name || 'Not set'}</p>
        <p>Game State: {gameSettings.state}</p>
      </div>
      {isGameInProgress && (
        <p className="mt-2 text-sm text-yellow-600">
          Game settings are locked during gameplay.
        </p>
      )}
      {!isLongestStandingPlayer && !isGameInProgress && (
        <p className="mt-2 text-sm text-blue-600">
          Only the longest-standing player can change settings.
        </p>
      )}
    </div>
  );
};

export default GameSettings;