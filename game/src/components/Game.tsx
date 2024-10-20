import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { Player, Room, GameType, GamePlayer } from "../services/gameInterface";
import GameSettings from "./GameSettings";
import GamePlay from "./GamePlay";

const Game: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [game, setGame] = useState<GameType | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string>("");
  const [isLongestStandingPlayer, setIsLongestStandingPlayer] =
    useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User ID not found. Please rejoin the room.");
      return;
    }
    setCurrentUserId(userId);
  }, []);

  const updateLongestStandingPlayer = useCallback(
    (playersData: GamePlayer[]) => {
      if (playersData.length > 0 && currentUserId) {
        const isLongest = playersData[0].user_id.toString() === currentUserId;
        setIsLongestStandingPlayer(isLongest);
      }
    },
    [currentUserId]
  );

  const fetchPlayers = useCallback(
    async (gameId: number) => {
      try {
        const { data: playersData, error: playersError } = await supabase
          .from("game_players")
          .select(
            `
            id,
            user_id,
            score,
            created_at,
            users (
              id,
              username
            )
          `
          )
          .eq("game_id", gameId)
          .order("created_at", { ascending: true });

        if (playersError) throw playersError;

        const sortedPlayers: Player[] = (
          playersData as unknown as GamePlayer[]
        ).map((player) => ({
          id: player.id,
          username: player.users.username,
          score: player.score,
        }));

        setPlayers(sortedPlayers);
        updateLongestStandingPlayer(playersData as unknown as GamePlayer[]);
      } catch (error) {
        console.error("Error fetching players:", error);
        setError("Error fetching players. Please try refreshing the page.");
      }
    },
    [updateLongestStandingPlayer]
  );

  const fetchGameState = useCallback(async () => {
    if (!game) return;
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", game.id)
        .single();

      if (error) throw error;

      if (data) {
        setGame(data);
        setGameStarted(data.state === "in_progress");
      }
    } catch (error) {
      console.error("Error fetching game state:", error);
      setError("Failed to load game state. Please try again.");
    }
  }, [game]);

  const fetchRoomGameAndPlayers = useCallback(async () => {
    if (!roomCode || !currentUserId) return;

    try {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select(
          `
          *,
          games (
            id,
            creator_id,
            target_score,
            time_limit,
            state,
            category_id,
            current_item,
            round_start_time
          )
        `
        )
        .eq("name", roomCode)
        .single();

      if (roomError) throw roomError;

      setRoom(roomData);
      setGame(roomData.games[0]);
      setGameStarted(roomData.games[0].state === "in_progress");

      await fetchPlayers(roomData.games[0].id);
    } catch (error) {
      console.error("Error fetching room data:", error);
      setError("Error fetching room data. Please try again.");
    }
  }, [roomCode, currentUserId, fetchPlayers]);

  useEffect(() => {
    fetchRoomGameAndPlayers();
  }, [fetchRoomGameAndPlayers]);

  useEffect(() => {
    if (game) {
      fetchGameState();
      fetchPlayers(game.id);
    }
  }, [game, fetchGameState, fetchPlayers]);

  useEffect(() => {
    if (!game || !room) return;

    const gamePlayersSubscription = supabase
      .channel(`public:game_players:game_id=eq.${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${game.id}`,
        },
        handlePlayerChange
      )
      .subscribe();

    const gamesSubscription = supabase
      .channel(`public:games:id=eq.${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        handleGameChange
      )
      .subscribe();

    const roomsSubscription = supabase
      .channel(`public:rooms:id=eq.${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        handleRoomChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamePlayersSubscription);
      supabase.removeChannel(gamesSubscription);
      supabase.removeChannel(roomsSubscription);
    };
  }, [game, room]);

  const handlePlayerChange = (payload: any) => {
    if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
      fetchPlayers(game!.id);
    } else if (payload.eventType === "UPDATE") {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === payload.new.id
            ? { ...player, score: payload.new.score }
            : player
        )
      );
    }
  };

  const handleGameChange = (payload: any) => {
    if (payload.new) {
      setGame((prevGame) => {
        const updatedGame = { ...prevGame, ...payload.new };
        setGameStarted(updatedGame.state === "in_progress");
        if (updatedGame.state === "finished" && updatedGame.winner) {
          const winningPlayer = players.find(
            (p) => p.id === updatedGame.winner
          );
          if (winningPlayer) {
            setGameWinner(winningPlayer);
          }
        }
        return updatedGame;
      });
    }
  };

  const handleRoomChange = (payload: any) => {
    setRoom((prevRoom) => ({ ...prevRoom, ...payload.new }));
  };

  const startGame = async () => {
    if (!isLongestStandingPlayer) {
      setError("Only the longest-standing player can start the game");
      return;
    }

    if (!game) {
      setError("Game data is not available");
      return;
    }

    if (!game.category_id) {
      setError("Please select a category before starting the game");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("games")
        .update({ state: "in_progress" })
        .eq("id", game.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setGameStarted(true);
        setGame((prevGame) => ({ ...prevGame, ...data[0] }));

        // Start the first round
        await startNextRound();
      } else {
        throw new Error("No data returned when starting the game");
      }
    } catch (error) {
      console.error("Error starting game:", error);
      setError("Failed to start game. Please try again.");
    }
  };

  const startNextRound = async () => {
    if (!game) return;

    try {
      const { data, error } = await supabase.rpc("start_new_round", {
        p_game_id: game.id,
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("games")
        .update({
          current_item: data.item,
          round_start_time: data.round_start_time,
          time_limit: data.time_limit,
        })
        .eq("id", game.id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error starting new round:", error);
      setError("Failed to start new round. Please try again.");
    }
  };

  const handlePlayerWin = async (winner: Player) => {
    try {
      const { error } = await supabase
        .from("games")
        .update({ state: "finished", winner: winner.id })
        .eq("id", game!.id);

      if (error) throw error;

      console.log("Game marked as finished");
    } catch (error) {
      console.error("Error updating game state:", error);
      setError("Failed to update game state. Please refresh the page.");
    }
  };

  const startNewGame = async () => {
    if (!isLongestStandingPlayer) {
      setError("Only the longest-standing player can start a new game");
      return;
    }

    try {
      // Reset game state
      const { data, error } = await supabase
        .from("games")
        .update({
          state: "waiting",
          current_item: null,
          round_start_time: null,
          category_id: null,
          target_score: null,
          time_limit: null,
        })
        .eq("id", game!.id)
        .select();

      if (error) throw error;

      // Reset player scores
      const { error: resetScoreError } = await supabase
        .from("game_players")
        .update({ score: 0 })
        .eq("game_id", game!.id);

      if (resetScoreError) throw resetScoreError;

      if (data && data.length > 0) {
        setGame((prevGame) => ({ ...prevGame, ...data[0] }));
        setGameWinner(null);
        setGameStarted(false);
        await fetchPlayers(game!.id);
      } else {
        throw new Error("No data returned when resetting the game");
      }
    } catch (error) {
      console.error("Error starting new game:", error);
      setError("Failed to start a new game. Please try again.");
    }
  };

  const leaveRoom = async () => {
    const username = localStorage.getItem("username");
    if (username && roomCode) {
      try {
        const { data, error } = await supabase.rpc("leave_room", {
          p_room_code: roomCode,
          p_username: username,
        });

        if (error) throw error;

        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        navigate("/");
      } catch (error) {
        console.error("Error leaving room:", error);
        setError(`Error leaving room. Please try again.`);
      }
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      leaveRoom();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!room || !game || !currentUserId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow-md w-full max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Room: {roomCode}</h2>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">
          Game Status: {game.state}
        </h3>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Players:</h3>
        <ul>
          {players.map((player) => (
            <li
              key={player.id}
              className="flex justify-between items-center py-1"
            >
              <span>{player.username}</span>
              <span className="font-bold">{player.score} points</span>
            </li>
          ))}
        </ul>
      </div>
      {gameWinner ? (
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Game Over!</h3>
          <p className="text-xl mb-4">
            {gameWinner.username} has won the game with {gameWinner.score}{" "}
            points!
          </p>
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-2">Final Scores:</h4>
            <ul>
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex justify-between items-center py-1"
                >
                  <span>{player.username}</span>
                  <span className="font-bold">{player.score} points</span>
                </li>
              ))}
            </ul>
          </div>
          {isLongestStandingPlayer && (
            <button
              onClick={startNewGame}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Start New Game
            </button>
          )}
        </div>
      ) : !gameStarted ? (
        <>
          <GameSettings
            gameId={game.id}
            isLongestStandingPlayer={isLongestStandingPlayer}
            onUpdateGame={(updatedGame) => {
              setGame((prevGame) => ({ ...prevGame, ...updatedGame }));
            }}
          />
          {isLongestStandingPlayer && (
            <button
              onClick={startGame}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Start Game
            </button>
          )}
        </>
      ) : (
        <GamePlay
          gameId={game.id}
          players={players}
          currentUserId={currentUserId}
          gameSettings={game}
          onRoundEnd={startNextRound}
          isLongestStandingPlayer={isLongestStandingPlayer}
          onPlayerWin={handlePlayerWin}
        />
      )}
      <button
        onClick={leaveRoom}
        className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
      >
        Leave Room
      </button>
    </div>
  );
};

export default Game;
