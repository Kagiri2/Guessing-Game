import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

interface Room {
  id: number;
  name: string;
}

interface RoomManagerProps {
  username: string;
}

const RoomManager: React.FC<RoomManagerProps> = ({ username }) => {
  const [roomCode, setRoomCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const generateRoomCode = (): string => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const createRoom = async (): Promise<void> => {
    // First, get the user's ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();
  
    if (userError || !userData) {
      setError("Error fetching user data. Please try again.");
      return;
    }
  
    const userId = userData.id;
  
    const newRoomCode = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ name: newRoomCode, player_count: 1 })
      .select()
      .single();
  
    if (error) {
      setError("Error creating room. Please try again.");
      return;
    }
  
    if (!data) {
      setError("Room created but no data returned. Please try again.");
      return;
    }
  
    const createdRoom = data as Room;
  
    // Create a new game associated with this room
    const { error: gameError } = await supabase.from("games").insert({
      room_id: createdRoom.id,
      creator_id: userId,  // Use the user's ID instead of username
      target_score: 10,
      time_limit: 60,
    });
  
    if (gameError) {
      setError("Error creating game. Please try again.");
    } else {
      navigate(`/game/${newRoomCode}`);
    }
  };
  
  const joinRoom = async (): Promise<void> => {
    if (roomCode.length !== 4) {
      setError("Room code must be 4 characters long.");
      return;
    }

    const { data, error } = await supabase
      .from("rooms")
      .select()
      .eq("name", roomCode)
      .single();

    if (error || !data) {
      setError("Room not found. Please check the code and try again.");
    } else {
      navigate(`/game/${roomCode}`);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={createRoom}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
      >
        Create Room
      </button>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter 4-letter room code"
          className="border-2 border-gray-300 rounded px-2 py-1"
          maxLength={4}
        />
        <button
          onClick={joinRoom}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Join Room
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default RoomManager;
