import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useParams } from "react-router-dom";

const Game = () => {
  const { roomCode } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRoomAndItems = async () => {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select()
        .eq("name", roomCode)
        .single();

      if (roomError) {
        console.error("Error fetching room data:", roomError);
        setError("Error fetching room data");
        return;
      }

      setRoom(roomData);

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
    };

    fetchRoomAndItems();

    const itemsSubscription = supabase
      .channel("public:items")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "items" },
        (payload) => {
          console.log("New item received:", payload.new);
          setItems((prevItems) => [...prevItems, payload.new]);
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(itemsSubscription);
    };
  }, [roomCode]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow-md w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-4">Room: {roomCode}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="p-2 border-b">
            {item.question}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Game;
