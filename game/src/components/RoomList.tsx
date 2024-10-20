import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

interface Room {
  id: number;
  name: string;
  player_count: number;
  game_status: string | null;
}

interface RoomListProps {
  onJoinRoom: (roomCode: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({ onJoinRoom }) => {
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    findRooms();
  }, []);

  const findRooms = async (): Promise<void> => {
    const { data, error } = await supabase
      .from("rooms")
      .select(
        `
        id, 
        name, 
        player_count,
        games (
          state,
          categories (
            name
          )
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to fetch available rooms. Please try again.");
    } else {
      const formattedRooms: Room[] = (data || []).map((room) => ({
        id: room.id,
        name: room.name,
        player_count: room.player_count,
        game_status: room.games[0]?.state || null,
      }));
      setAvailableRooms(formattedRooms);
    }
  };

  const getGameStatusDisplay = (status: string | null): string => {
    switch (status) {
      case "waiting":
        return "Waiting to start";
      case "in_progress":
        return "In progress";
      case "finished":
        return "Finished";
      default:
        return "Not started";
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-4 text-white">
        Available Rooms:
      </h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {availableRooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white bg-opacity-20 p-4 rounded-lg shadow-md hover:bg-opacity-30 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white">{room.name}</span>
                <button
                  onClick={() => onJoinRoom(room.name)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm transition duration-300"
                >
                  Join
                </button>
              </div>
              <div className="text-sm text-gray-200">
                <p>Players: {room.player_count}</p>
                <p>Status: {getGameStatusDisplay(room.game_status)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white">No rooms available. Why not create one?</p>
      )}
    </div>
  );
};

export default RoomList;
