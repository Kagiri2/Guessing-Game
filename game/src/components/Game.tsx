import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const Game = () => {
  const { roomCode } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [error, setError] = useState('');
  const socket = io('http://localhost:5173');

  useEffect(() => {
    const fetchRoomAndItems = async () => {
      // Fetch room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select()
        .eq('name', roomCode)
        .single();

      if (roomError) {
        setError('Error fetching room data');
        return;
      }

      setRoom(roomData);

      // Fetch items for the game
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .limit(10); // Adjust the limit as needed

      if (itemsError) {
        setError('Error fetching items');
        return;
      }

      setItems(itemsData || []);
    };

    fetchRoomAndItems();

    // Set up Socket.io listener
    socket.on('update', (data) => {
      setItems((prevItems) => [...prevItems, data]);
    });

    return () => {
      socket.disconnect();
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
          <li key={item.id} className="p-2 border-b">{item.question}</li>
        ))}
      </ul>
    </div>
  );
};

export default Game;