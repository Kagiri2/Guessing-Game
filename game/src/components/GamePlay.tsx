import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Player, GameType, Item } from '../services/gameInterface';

interface GamePlayProps {
  gameId: number;
  players: Player[];
  currentUserId: string;
  gameSettings: GameType;
}

const GamePlay: React.FC<GamePlayProps> = ({ gameId, players, currentUserId, gameSettings }) => {
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [userGuess, setUserGuess] = useState<string>('');
  const [roundTimer, setRoundTimer] = useState<number | null>(null);
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const fetchNextItem = useCallback(async () => {
    if (!gameSettings.category_id) {
      console.error('No category_id provided in gameSettings:', gameSettings);
      setError('Game settings are incomplete. Please try rejoining the game.');
      return;
    }
  
    try {
      console.log('Fetching next item for category:', gameSettings.category_id);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('category_id', gameSettings.category_id)
        .limit(1)
        .single();
  
      if (error) throw error;
  
      if (data) {
        console.log('Fetched item:', data);
        setCurrentItem(data);
        setRoundStartTime(Date.now());
        setRoundTimer(gameSettings.time_limit || null);
      } else {
        setError('No items found for this category');
      }
    } catch (error) {
      console.error('Error fetching next item:', error);
      setError('Failed to load next question. Please try again.');
    }
  }, [gameSettings.category_id, gameSettings.time_limit]);

  useEffect(() => {
    fetchNextItem();
    const userGuessesSubscription = setupRealTimeSubscriptions();
    return () => {
      supabase.removeChannel(userGuessesSubscription);
    };
  }, [fetchNextItem]);

  const setupRealTimeSubscriptions = () => {
    return supabase
      .channel(`public:user_guesses:game_id=eq.${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_guesses", filter: `game_id=eq.${gameId}` },
        handleUserGuessChange
      )
      .subscribe();
  };

  const handleUserGuessChange = (payload: any) => {
    console.log("User guess change:", payload);
    // Update the UI based on the new guess
    // You might want to show who made a correct guess, update scores, etc.
  };

  const submitGuess = async () => {
    if (!currentItem || !userGuess.trim()) return;

    const isCorrect = userGuess.toLowerCase() === currentItem.answer.toLowerCase();

    try {
      const { data, error } = await supabase
        .from('user_guesses')
        .insert({
          item_id: currentItem.id,
          game_player_id: players.find(p => p.id.toString() === currentUserId)?.id,
          guessed_answer: userGuess,
          correct: isCorrect
        });

      if (error) throw error;

      console.log('Guess submitted:', data);
      setUserGuess('');
      
      if (isCorrect) {
        console.log('Correct guess!');
        await updatePlayerScore();
        fetchNextItem();
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
      setError('Failed to submit guess. Please try again.');
    }
  };

  const updatePlayerScore = async () => {
    try {
      const { data, error } = await supabase
        .from('game_players')
        .update({ score: supabase.rpc('increment', { x: 1 }) })
        .eq('game_id', gameId)
        .eq('user_id', currentUserId);

      if (error) throw error;

      console.log('Player score updated:', data);
    } catch (error) {
      console.error('Error updating player score:', error);
      setError('Failed to update score. The game will continue, but scores may be inaccurate.');
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (roundTimer !== null && roundTimer > 0) {
      timer = setInterval(() => {
        setRoundTimer(prev => {
          if (prev !== null && prev > 0) {
            return prev - 1;
          } else {
            clearInterval(timer);
            fetchNextItem();
            return null;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [roundTimer, fetchNextItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserGuess(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitGuess();
  };

  if (!currentItem) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <img src={currentItem.image_url} alt="Question" className="mx-auto max-w-full h-auto" />
        <p className="mt-2 text-xl font-bold">{currentItem.question}</p>
      </div>
      {roundTimer !== null && (
        <div className="text-center">
          <p>Time remaining: {roundTimer} seconds</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={userGuess}
          onChange={handleInputChange}
          placeholder="Your guess"
          className="flex-grow px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Submit
        </button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default GamePlay;