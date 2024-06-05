import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GuestContext } from '../App';
import { Box, Button, TextField, Typography } from '@mui/material';

function RoomPage() {
   const { roomId } = useParams<{ roomId: string }>();
   const context = useContext(GuestContext);
   if (!context) {
      throw new Error('Page must be used within a GuestContext.Provider');
   }

   const navigate = useNavigate();

useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
        event.preventDefault();
        // Replace with your delete room API endpoint
        const data = new Blob([], { type: 'application/json' });
        navigator.sendBeacon(`http://localhost:8080/api/rooms/${roomId}`, data);
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup when component unmounts
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
}, [roomId]); // roomId added to dependency array

   return <p>hi</p>;
}

export default RoomPage;
