import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

interface RoomManagerProps {
  username: string;
}

interface Room {
  id: number;
  name: string;
  player_count: number;
  game_status: string | null;
}

const RoomManager: React.FC<RoomManagerProps> = ({ username }) => {
  const [roomCode, setRoomCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [showRooms, setShowRooms] = useState<boolean>(false);
  const navigate = useNavigate();

  const generateRoomCode = (): string => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const createRoom = async (): Promise<void> => {
    const newRoomCode = generateRoomCode();
    const { data, error } = await supabase.rpc("create_room", {
      p_room_code: newRoomCode,
      p_creator_username: username,
    });

    if (error) {
      console.error("Error creating room:", error);
      setError("Error creating room. Please try again.");
      return;
    }

    console.log("Create room response:", data);

    if (!data || data.length === 0) {
      setError("Room created but no data returned. Please try again.");
      return;
    }

    const roomData = data[0];

    if (!roomData.room_id || !roomData.user_id) {
      setError("Room created but incomplete data returned. Please try again.");
      return;
    }

    localStorage.setItem("username", username);
    localStorage.setItem("userId", roomData.user_id.toString());
    localStorage.setItem("roomId", roomData.room_id.toString());
    navigate(`/${newRoomCode}`);  
  };

  const joinRoom = async (roomCodeToJoin: string): Promise<void> => {
    if (roomCodeToJoin.length !== 4) {
      setError("Room code must be 4 characters long.");
      return;
    }
    const { data, error } = await supabase.rpc("join_room", {
      p_room_code: roomCodeToJoin,
      p_username: username,
    });

    if (error) {
      if (error.message.includes("Room is full")) {
        setError("This room is full. Please try another room.");
      } else if (error.message.includes("Room not found")) {
        setError("Room not found. Please check the code and try again.");
      } else {
        console.error("Error joining room:", error);
        setError("An error occurred while joining the room. Please try again.");
      }
    } else if (data && data.length > 0) {
      const joinData = data[0];
      if (joinData.joined_user_id && joinData.joined_room_id) {
        localStorage.setItem("username", username);
        localStorage.setItem("userId", joinData.joined_user_id.toString());
        localStorage.setItem("roomId", joinData.joined_room_id.toString());
        navigate(`/${roomCodeToJoin}`);  
      } else {
        setError("Incomplete data returned when joining room. Please try again.");
      }
    } else {
      setError("No data returned when joining room. Please try again.");
    }
  };

  const findRooms = async (): Promise<void> => {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        id, 
        name, 
        player_count,
        games (
          state,
          categories (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to fetch available rooms. Please try again.");
    } else {
      const formattedRooms: Room[] = (data || []).map(room => ({
        id: room.id,
        name: room.name,
        player_count: room.player_count,
        game_status: room.games[0]?.state || null
      }));
      setAvailableRooms(formattedRooms);
      setShowRooms(true);
    }
  };

  const getGameStatusDisplay = (status: string | null): string => {
    switch (status) {
      case 'waiting':
        return 'Waiting to start';
      case 'in_progress':
        return 'In progress';
      case 'finished':
        return 'Finished';
      default:
        return 'Not started';
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={createRoom}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition duration-300"
      >
        Create Room
      </button>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter 4-letter room code"
          className="flex-grow px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={4}
        />
        <button
          onClick={() => joinRoom(roomCode)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Join Room
        </button>
      </div>
      <button
        onClick={findRooms}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded transition duration-300"
      >
        Find Rooms
      </button>
      {showRooms && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Available Rooms:</h3>
          {availableRooms.length > 0 ? (
            <ul className="space-y-2">
              {availableRooms.map((room) => (
                <li key={room.id} className="bg-gray-100 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{room.name}</span>
                    <button
                      onClick={() => joinRoom(room.name)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-sm"
                    >
                      Join
                    </button>
                  </div>
                  <div className="text-sm">
                    <p>Players: {room.player_count}</p>
                    <p>Status: {getGameStatusDisplay(room.game_status)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No rooms available. Why not create one?</p>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default RoomManager;