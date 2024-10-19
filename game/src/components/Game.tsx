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
        console.log("Is longest standing player:", isLongest);
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

        console.log("Fetched players data:", playersData);
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

      console.log("Fetched room data:", roomData);
      console.log("Time limit from database:", roomData.games[0].time_limit);
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
    console.log("Player change:", payload);

    if (payload.eventType === "INSERT") {
      fetchPlayers(game!.id); // Re-fetch all players when a new player joins
    } else if (payload.eventType === "DELETE") {
      setPlayers((prevPlayers) => {
        const updatedPlayers = prevPlayers.filter(
          (player) => player.id !== payload.old.id
        );
        updateLongestStandingPlayer(
          updatedPlayers.map((p) => ({
            id: p.id,
            user_id: parseInt(currentUserId || "0"),
            score: p.score,
            created_at: new Date().toISOString(),
            users: { id: parseInt(currentUserId || "0"), username: p.username },
          }))
        );
        return updatedPlayers;
      });
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
    console.log("Game change:", payload);
    if (payload.new) {
      setGame((prevGame) => {
        const updatedGame = { ...prevGame, ...payload.new };
        setGameStarted(updatedGame.state === "in_progress");
        console.log("Updated game state:", updatedGame);
        return updatedGame;
      });
    }
  };

  const handleRoomChange = (payload: any) => {
    console.log("Room change:", payload);
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

    console.log("Starting game with settings:", game);

    try {
      const { data, error } = await supabase
        .from("games")
        .update({ state: "in_progress" })
        .eq("id", game.id)
        .select();

      if (error) throw error;

      console.log("Game start response:", data);

      if (data && data.length > 0) {
        console.log("Game started successfully:", data[0]);
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

      console.log("New round started:", data);

      // Update the game state in the database
      const { error: updateError } = await supabase
        .from("games")
        .update({
          current_item: data.item,
          round_start_time: data.round_start_time,
          time_limit: data.time_limit,
        })
        .eq("id", game.id);

      if (updateError) throw updateError;

      // Local state update is now handled by the real-time subscription
    } catch (error) {
      console.error("Error starting new round:", error);
      setError("Failed to start new round. Please try again.");
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

        console.log("Leave room result:", data);
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
      {!gameStarted ? (
        <>
          <GameSettings
            gameId={game.id}
            isLongestStandingPlayer={isLongestStandingPlayer}
            onUpdateGame={(updatedGame) => {
              setGame((prevGame) => {
                const newGame = { ...prevGame, ...updatedGame };
                console.log("Game settings updated:", newGame);
                console.log("New time limit:", newGame.time_limit);
                return newGame;
              });
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
