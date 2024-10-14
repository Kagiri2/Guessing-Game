import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import io from 'socket.io-client';

const Game = () => {
  console.log("Game component rendered");
  const [items, setItems] = useState<any[]>([]);
  const socket = io('http://localhost:5173');  
  
  useEffect(() => {
    const fetchData = async () => {
      let { data, error } = await supabase.from('items').select('*');
      if (error) {
        console.error('Error fetching data:', error);
      } else {
        setItems(data || []);
      }
    };
    
    fetchData();

    socket.on('update', (data) => {
      setItems((prevItems) => [...prevItems, data]);
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow-md w-full max-w-lg">
      <ul>
        {items.map((item) => (
          <li key={item.id} className="p-2 border-b">{item.text}</li>
        ))}
      </ul>
    </div>
  );
};

export default Game;
