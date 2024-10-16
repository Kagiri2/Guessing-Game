import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { Player, Room, GameType, GamePlayer } from "../services/gameInterface";
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
            state
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
        .eq("game_id", roomData.games[0].id)
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
      console.log("Longest standing player ID:", playersData[0].user_id.toString());
      console.log("Current user ID:", currentUserId);
      if (sortedPlayers.length > 0) {
        setIsLongestStandingPlayer(playersData[0].user_id.toString() === currentUserId);
      }
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
          filter: `game_id=eq.${game?.id}`,
        },
        handlePlayerChange
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(playersSubscription);
    };
  }, [roomCode, game?.id, currentUserId]);

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
              // Update isLongestStandingPlayer status
              if (currentUserId) {
                setIsLongestStandingPlayer(payload.new.user_id.toString() === currentUserId);
              }
              return updatedPlayers;
            });
          }
        });
    } else if (payload.eventType === "DELETE") {
      // Player left
      setPlayers((prevPlayers) => {
        const updatedPlayers = prevPlayers.filter((player) => player.id !== payload.old.id);
        // Update isLongestStandingPlayer status
        if (currentUserId && updatedPlayers.length > 0) {
          setIsLongestStandingPlayer(payload.old.user_id.toString() !== currentUserId);
        }
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
        if (data && data.length > 0 && data[0].success) {
          if (data[0].removed_username !== username) {
            console.error(
              `Unexpected user removed: ${data[0].removed_username}`
            );
            setError(`Unexpected user removed: ${data[0].removed_username}`);
          } else {
            localStorage.removeItem("username");
            localStorage.removeItem("userId");
            navigate("/");
          }
        } else {
          console.error("Failed to leave room");
          setError("Failed to leave room");
        }
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