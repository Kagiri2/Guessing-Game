import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GuestContext } from '../App';
import { Box, Button, TextField, Typography } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

function Page() {
   const { roomId } = useParams<{ roomId: string }>();
   const context = useContext(GuestContext);
   if (!context) {
      throw new Error('Page must be used within a GuestContext.Provider');
   }
   const { guestName, setGuestName, guestId, setGuestId } = context;
   const [inputValue, setInputValue] = useState<string>('');
   const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
   const [roomCode, setRoomCode] = useState<string>('');

   const navigate = useNavigate();

   const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
   };

   const handleInputSubmit = () => {
      if (setGuestName && setGuestId) {
         setGuestName(inputValue);
         setGuestId(uuidv4());
         setIsSubmitted(true);
      }
   };

   const handleCreateRoom = async () => {
      const response = await fetch('http://localhost:8080/api/rooms', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({ creatorId: guestId }),
      });

      if (!response.ok) {
         throw new Error('Failed to create room');
      }

      const room = await response.json();
      navigate(`/room/${room.code}`);
   };

    const handleJoinRoom = async () => {
        const response = await fetch('http://localhost:8080/api/rooms/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: roomCode }),
        });

        if (!response.ok) {
            // Handle error
            console.error('Error joining room');
            return;
        }

        const room = await response.json();
        // Navigate to the room page
        navigate(`/rooms/${room.id}`);
    };

   useEffect(() => {
      function handleBeforeUnload(event: BeforeUnloadEvent) {
         console.log(roomId);
         event.preventDefault();
         // Replace with your delete room API endpoint
         fetch(`http://localhost:8080/api/rooms/${roomId}`, {
            method: 'DELETE',
         });
      }

      window.addEventListener('beforeunload', handleBeforeUnload);

      // Cleanup when component unmounts
      return () => {
         window.removeEventListener('beforeunload', handleBeforeUnload);
      };
   }, []);

   return (
      <Box
         display="flex"
         flexDirection="column"
         alignItems="center"
         justifyContent="center"
         minHeight="100vh"
      >
         {!isSubmitted ? (
            <Box
               display="flex"
               flexDirection="column"
               alignItems="center"
               bgcolor="#fff"
               borderRadius="10px"
               p={3}
               boxShadow={1}
            >
               <TextField
                  variant="outlined"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  margin="normal"
               />
               <Button
                  variant="contained"
                  color="primary"
                  onClick={handleInputSubmit}
               >
                  Submit
               </Button>
            </Box>
         ) : (
            <>
               <Typography>Welcome, {guestName}!</Typography>
               <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  bgcolor="#fff"
                  borderRadius="10px"
                  p={3}
                  boxShadow={1}
                  mt={3}
               >
                  <TextField
                     variant="outlined"
                     value={roomCode}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRoomCode(e.target.value)
                     }
                     placeholder="Enter room code"
                     margin="normal"
                  />
                  <Button
                     variant="contained"
                     color="primary"
                     onClick={handleJoinRoom}
                  >
                     Join Room
                  </Button>
               </Box>
               <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  bgcolor="#fff"
                  borderRadius="10px"
                  p={3}
                  boxShadow={1}
                  mt={3}
               >
                  <Button
                     variant="contained"
                     color="primary"
                     onClick={handleCreateRoom}
                  >
                     Create Room
                  </Button>
               </Box>
            </>
         )}
      </Box>
   );
}

export default Page;
