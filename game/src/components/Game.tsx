import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { Player, Room, GameType, GamePlayer, User } from "../services/gameInterface";
import GameSettings from "./GameSettings";

const Game: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [game, setGame] = useState<GameType | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string>("");
  const [isLongestStandingPlayer, setIsLongestStandingPlayer] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User ID not found. Please rejoin the room.");
      return;
    }
    setCurrentUserId(userId);
    console.log("Current user ID set:", userId);
  }, []);

  useEffect(() => {
    const fetchRoomGameAndPlayers = async () => {
      if (!roomCode || !currentUserId) return;

      // Fetch room and associated game data
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
            category_id
          )
        `
        )
        .eq("name", roomCode)
        .single();

      if (roomError) {
        console.error("Error fetching room data:", roomError);
        setError("Error fetching room data");
        return;
      }

      setRoom(roomData);
      setGame(roomData.games[0]);

      // Fetch players in the game
      fetchPlayers(roomData.games[0].id);
    };
    
    fetchRoomGameAndPlayers();
  }, [roomCode, currentUserId]);

  const fetchPlayers = async (gameId: number) => {
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
      .order('created_at', { ascending: true });

    if (playersError) {
      console.error("Error fetching players:", playersError);
      setError("Error fetching players");
      return;
    }

    const sortedPlayers: Player[] = (playersData as unknown as GamePlayer[]).map((player) => ({
      id: player.id,
      username: player.users.username,
      score: player.score,
    }));

    setPlayers(sortedPlayers);
    updateLongestStandingPlayer(playersData as unknown as  GamePlayer[]);
  };

  const updateLongestStandingPlayer = (playersData: GamePlayer[]) => {
    if (playersData.length > 0 && currentUserId) {
      setIsLongestStandingPlayer(playersData[0].user_id.toString() === currentUserId);
    }
  };

  useEffect(() => {
    if (!game || !room) return;

    const gamePlayersSubscription = supabase
      .channel(`public:game_players:game_id=eq.${game.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${game.id}` },
        handlePlayerChange
      )
      .subscribe();

    const gamesSubscription = supabase
      .channel(`public:games:id=eq.${game.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${game.id}` },
        handleGameChange
      )
      .subscribe();

    const roomsSubscription = supabase
      .channel(`public:rooms:id=eq.${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        handleRoomChange
      )
      .subscribe();

    const userGuessesSubscription = supabase
      .channel(`public:user_guesses:game_id=eq.${game.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_guesses", filter: `game_id=eq.${game.id}` },
        handleUserGuessChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamePlayersSubscription);
      supabase.removeChannel(gamesSubscription);
      supabase.removeChannel(roomsSubscription);
      supabase.removeChannel(userGuessesSubscription);
    };
  }, [game, room]);

  const handlePlayerChange = (payload: any) => {
    console.log("Player change:", payload);

    if (payload.eventType === "INSERT") {
      // New player joined
      supabase
        .from("users")
        .select("id, username")
        .eq("id", payload.new.user_id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            const newPlayer: Player = {
              id: payload.new.id,
              username: data.username,
              score: payload.new.score,
            };
            setPlayers((prevPlayers) => {
              const updatedPlayers = [...prevPlayers, newPlayer];
              updateLongestStandingPlayer(updatedPlayers.map(p => ({
                id: p.id,
                user_id: parseInt(currentUserId || '0'),
                score: p.score,
                created_at: new Date().toISOString(),
                users: { id: parseInt(currentUserId || '0'), username: p.username }
              })));
              return updatedPlayers;
            });
          }
        });
    } else if (payload.eventType === "DELETE") {
      // Player left
      setPlayers((prevPlayers) => {
        const updatedPlayers = prevPlayers.filter((player) => player.id !== payload.old.id);
        updateLongestStandingPlayer(updatedPlayers.map(p => ({
          id: p.id,
          user_id: parseInt(currentUserId || '0'),
          score: p.score,
          created_at: new Date().toISOString(),
          users: { id: parseInt(currentUserId || '0'), username: p.username }
        })));
        return updatedPlayers;
      });
    } else if (payload.eventType === "UPDATE") {
      // Player data updated (e.g., score changed)
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
    setGame(prevGame => ({ ...prevGame, ...payload.new }));
  };

  const handleRoomChange = (payload: any) => {
    console.log("Room change:", payload);
    setRoom(prevRoom => ({ ...prevRoom, ...payload.new }));
  };

  const handleUserGuessChange = (payload: any) => {
    console.log("User guess change:", payload);
    // Handle user guess changes (e.g., update scores, show new guesses)
    // You might want to implement this based on your game logic
  };

  const leaveRoom = async () => {
    const username = localStorage.getItem("username");
    if (username && roomCode) {
      const { data, error } = await supabase.rpc("leave_room", {
        p_room_code: roomCode,
        p_username: username,
      });

      if (error) {
        console.error("Error leaving room:", error);
        setError(`Error leaving room: ${error.message}`);
      } else {
        console.log("Leave room result:", data);
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        navigate("/");
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
      <GameSettings
        gameId={game.id}
        isLongestStandingPlayer={isLongestStandingPlayer}
      />
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