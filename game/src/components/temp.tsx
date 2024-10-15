import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { GamePlayer, Player, Room, Item } from "../services/gameInterface";

const Game = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRoomAndItems = async () => {
      // Fetch room and associated game
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select(`
          *,
          games!inner (
            id
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

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .limit(10);

      if (itemsError) {
        console.error("Error fetching items:", itemsError);
        setError("Error fetching items");
        return;
      }

      setItems(itemsData || []);

      // Fetch players in the game using the simplified query
      const { data: playersData, error: playersError } = await supabase
        .from("game_players")
        .select(`
          id,
          score,
          user_id,
          users!inner (
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
        (playersData as unknown as GamePlayer[])?.map((player) => ({
          id: player.id,
          username: player.users.username,
          score: player.score,
        })) || []
      );
      console.log(playersData);
    };

    fetchRoomAndItems();

    // Set up real-time subscriptions
    const itemsSubscription = supabase
      .channel("public:items")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "items" },
        (payload) => {
          console.log("New item received:", payload.new);
          setItems((prevItems) => [...prevItems, payload.new as Item]);
        }
      )
      .subscribe();

    const playersSubscription = supabase
      .channel("public:game_players")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_players" },
        (payload) => {
          console.log("Player change:", payload);
          fetchRoomAndItems(); 
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(itemsSubscription);
      supabase.removeChannel(playersSubscription);
    };
  }, [roomCode]);

  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      event.preventDefault();
      await leaveRoom();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow-md w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-4">Room: {roomCode}</h2>
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
      <h3 className="text-xl font-semibold mb-2">Items:</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="p-2 border-b">
            {item.question}
          </li>
        ))}
      </ul>
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