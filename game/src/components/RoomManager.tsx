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

    try {
      // Step 1: Check if the room exists and get its ID
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, player_count")
        .eq("name", roomCode)
        .single();

      if (roomError || !roomData) {
        setError("Room not found. Please check the code and try again.");
        return;
      }

      if (roomData.player_count >= 100) {
        setError("This room is full. Please try another room.");
        return;
      }

      // Step 2: Get or create the user
      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (userError) {
        // User doesn't exist, create a new one
        const { data: newUser, error: createUserError } = await supabase
          .from("users")
          .insert({ username })
          .select("id")
          .single();

        if (createUserError) {
          setError("Error creating user. Please try again.");
          return;
        }

        userData = newUser;
      }

      // Step 3: Get the game associated with the room
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id")
        .eq("room_id", roomData.id)
        .single();

      if (gameError || !gameData) {
        setError("Error finding game. Please try again.");
        return;
      }

      // Step 4: Add the player to the game_players table
      const { error: joinError } = await supabase
        .from("game_players")
        .insert({ game_id: gameData.id, user_id: userData.id, score: 0 });

      if (joinError) {
        setError("Error joining the game. Please try again.");
        return;
      }

      // Step 5: Increment the player count in the room
      const { error: updateError } = await supabase
        .from("rooms")
        .update({ player_count: roomData.player_count + 1 })
        .eq("id", roomData.id);

      if (updateError) {
        setError("Error updating room. Please try again.");
        return;
      }

      // If everything is successful, navigate to the game
      localStorage.setItem("username", username);
      navigate(`/game/${roomCode}`);
    } catch (error) {
      console.error("Error joining room:", error);
      setError("An unexpected error occurred. Please try again.");
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