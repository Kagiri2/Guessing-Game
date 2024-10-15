import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

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
    const newRoomCode = generateRoomCode();
    const { data, error } = await supabase.rpc("create_room", {
      p_room_code: newRoomCode,
      p_creator_username: username,
    });

    if (error) {
      setError("Error creating room. Please try again.");
      return;
    }

    if (data === null) {
      setError("Room created but no data returned. Please try again.");
      return;
    }

    const roomId = data;

    localStorage.setItem("username", username);
    localStorage.setItem("roomId", roomId.toString());
    navigate(`/game/${newRoomCode}`);
  };

  const joinRoom = async (): Promise<void> => {
    if (roomCode.length !== 4) {
      setError("Room code must be 4 characters long.");
      return;
    }
    const { data, error } = await supabase.rpc("join_room", {
      p_room_code: roomCode,
      p_username: username,
    });

    if (error) {
      if (error.message.includes("Room is full")) {
        setError("This room is full. Please try another room.");
      } else if (error.message.includes("Room not found")) {
        setError("Room not found. Please check the code and try again.");
      } else {
        setError("An error occurred while joining the room. Please try again.");
      }
    } else if (data) {
      localStorage.setItem("username", username);
      navigate(`/game/${roomCode}`);
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
          onClick={joinRoom}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Join Room
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default RoomManager;