import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuestContext } from '../App';
import { Box, Button, TextField, Typography } from '@mui/material';

function Page() {
   const context = useContext(GuestContext);
   if (!context) {
      throw new Error('Page must be used within a GuestContext.Provider');
   }
   const { guestName, setGuestName } = context;
   const [inputValue, setInputValue] = useState<string>('');
   const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

   const navigate = useNavigate();

   const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
   };

   const handleInputSubmit = () => {
      if (setGuestName) {
         setGuestName(inputValue);
         setIsSubmitted(true);
      }
   };

   const handleCreateRoom = async () => {
      const response = await fetch('http://localhost:8080/api/rooms', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({ code: inputValue }), // replace with actual data if needed
      });

      if (!response.ok) {
         throw new Error('Failed to create room');
      }

      const room = await response.json();
      navigate(`/room/${room.code}`);
   };
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
            <Typography>Welcome, {guestName}!</Typography>
         )}
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
            <Button variant="contained" color="primary">
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
      </Box>
   );
}

export default Page;
