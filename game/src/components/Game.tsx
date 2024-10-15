import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { Player, Room, GameType } from "../services/gameInterface";

const Game: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [game, setGame] = useState<GameType | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchRoomGameAndPlayers = async () => {
      if (!roomCode) return;

      // Fetch room and associated game data
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select(`
          *,
          games (
            id,
            creator_id,
            target_score,
            time_limit,
            state
          )
        `)
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
      const { data: playersData, error: playersError } = await supabase
        .from("game_players")
        .select(`
          id,
          score,
          users (
            id,
            username
          )
        `)
        .eq("game_id", roomData.games[0].id);

      if (playersError) {
        console.error("Error fetching players:", playersError);
        setError("Error fetching players");
        return;
      }

      setPlayers(
        playersData.map((player: any) => ({
          id: player.id,
          username: player.users.username,
          score: player.score,
        }))
      );
    };

    fetchRoomGameAndPlayers();

    // Set up real-time subscription for game_players table
    const playersSubscription = supabase
      .channel(`public:game_players:game_id=eq.${game?.id}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "game_players",
          filter: `game_id=eq.${game?.id}`
        },
        handlePlayerChange
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(playersSubscription);
    };
  }, [roomCode, game?.id]);

  const handlePlayerChange = (payload: any) => {
    console.log("Player change:", payload);
    
    if (payload.eventType === "INSERT") {
      // New player joined
      supabase
        .from("users")
        .select("username")
        .eq("id", payload.new.user_id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            const newPlayer: Player = {
              id: payload.new.id,
              username: data.username,
              score: payload.new.score,
            };
            setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
          }
        });
    } else if (payload.eventType === "DELETE") {
      // Player left
      setPlayers((prevPlayers) =>
        prevPlayers.filter((player) => player.id !== payload.old.id)
      );
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

  const leaveRoom = async () => {
    const username = localStorage.getItem("username");
    if (username && roomCode) {
      const { error } = await supabase.rpc("leave_room", {
        p_room_code: roomCode,
        p_username: username,
      });

      if (error) {
        console.error("Error leaving room:", error);
      } else {
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

  if (!room || !game) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow-md w-full max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Room: {roomCode}</h2>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Game Status: {game.state}</h3>
        <p>Target Score: {game.target_score}</p>
        <p>Time Limit: {game.time_limit ? `${game.time_limit} seconds` : 'No limit'}</p>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Players:</h3>
        <ul>
          {players.map((player) => (
            <li key={player.id} className="flex justify-between items-center py-1">
              <span>{player.username}</span>
              <span className="font-bold">{player.score} points</span>
            </li>
          ))}
        </ul>
      </div>
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