import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { Player, GameType, Item } from "../services/gameInterface";

interface GamePlayProps {
  gameId: number;
  players: Player[];
  currentUserId: string;
  gameSettings: GameType;
  onRoundEnd: () => Promise<void>;
  isLongestStandingPlayer: boolean;
}

const GamePlay: React.FC<GamePlayProps> = ({
  gameId,
  players,
  currentUserId,
  gameSettings,
  onRoundEnd,
  isLongestStandingPlayer,
}) => {
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [userGuess, setUserGuess] = useState<string>("");
  const [roundTimer, setRoundTimer] = useState<number | null>(null);
  const [roundStartTime, setRoundStartTime] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isRoundEnding, setIsRoundEnding] = useState<boolean>(false);

  const TIME_OFFSET = 14400; // 14400 seconds offset

  const fetchGameState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("current_item, round_start_time, time_limit")
        .eq("id", gameId)
        .single();

      if (error) throw error;

      if (data) {
        console.log("Fetched game state:", data);
        setCurrentItem(data.current_item);
        const adjustedStartTime = new Date(data.round_start_time);
        adjustedStartTime.setSeconds(adjustedStartTime.getSeconds() - TIME_OFFSET);
        setRoundStartTime(adjustedStartTime.toISOString());
        console.log("Adjusted round start time:", adjustedStartTime.toISOString());
        console.log("Fetched time limit:", data.time_limit);
        setIsRoundEnding(false);
      }
    } catch (error) {
      console.error("Error fetching game state:", error);
      setError("Failed to load game state. Please try again.");
    }
  }, [gameId]);

  useEffect(() => {
    fetchGameState();
    const gameStateSubscription = setupRealTimeSubscriptions();
    return () => {
      supabase.removeChannel(gameStateSubscription);
    };
  }, [fetchGameState]);

  useEffect(() => {
    fetchGameState();
  }, [gameSettings, fetchGameState]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const updateTimer = () => {
      if (roundStartTime && gameSettings.time_limit) {
        const now = new Date().getTime();
        const startTime = new Date(roundStartTime).getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const remainingSeconds = Math.max(
          0,
          gameSettings.time_limit - elapsedSeconds
        );
        setRoundTimer(remainingSeconds);

        if (remainingSeconds > 0) {
          timer = setTimeout(updateTimer, 1000);
        } else if (!isRoundEnding) {
          console.log("Timer reached zero, starting new round");
          setIsRoundEnding(true);
          if (isLongestStandingPlayer) {
            onRoundEnd();
          }
        }
      }
    };

    updateTimer();

    return () => clearTimeout(timer);
  }, [roundStartTime, gameSettings.time_limit, onRoundEnd, isLongestStandingPlayer, isRoundEnding]);

  const setupRealTimeSubscriptions = () => {
    return supabase
      .channel(`public:games:id=eq.${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        handleGameStateChange
      )
      .subscribe();
  };

  const handleGameStateChange = (payload: any) => {
    console.log("Game state change:", payload);
    if (payload.new) {
      setCurrentItem(payload.new.current_item);
      const adjustedStartTime = new Date(payload.new.round_start_time);
      adjustedStartTime.setSeconds(adjustedStartTime.getSeconds() - TIME_OFFSET);
      setRoundStartTime(adjustedStartTime.toISOString());
      console.log("Adjusted new round start time:", adjustedStartTime.toISOString());
      setUserGuess("");
      setIsRoundEnding(false);
    }
  };

  const submitGuess = async () => {
    if (!currentItem || !userGuess.trim()) return;

    const isCorrect =
      userGuess.toLowerCase() === currentItem.answer.toLowerCase();
    const currentPlayer = players.find(
      (p) => p.id.toString() === currentUserId
    );

    if (!currentPlayer) {
      console.error("Current player not found:", currentUserId, players);
      setError("Failed to submit guess. Player not found.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_guesses")
        .insert({
          item_id: currentItem.id,
          game_id: gameId,
          game_player_id: currentPlayer.id,
          guessed_answer: userGuess,
          correct: isCorrect,
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Guess submitted:", data);
      setUserGuess("");

      if (isCorrect) {
        console.log("Correct guess!");
        await updatePlayerScore(currentPlayer.id);
      }
    } catch (error) {
      console.error("Error submitting guess:", error);
      setError("Failed to submit guess. Please try again.");
    }
  };

  const updatePlayerScore = async (playerId: number) => {
    try {
      const { data, error } = await supabase
        .from("game_players")
        .update({ score: supabase.rpc("increment", { x: 1 }) })
        .eq("id", playerId)
        .select();

      if (error) throw error;

      console.log("Player score updated:", data);
    } catch (error) {
      console.error("Error updating player score:", error);
      setError(
        "Failed to update score. The game will continue, but scores may be inaccurate."
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserGuess(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitGuess();
  };

  if (!currentItem) {
    return <div>Waiting for the next question...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <img
          src={currentItem.image_url}
          alt="Question"
          className="mx-auto max-w-full h-auto"
        />
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