drop function if exists create_room (text, text);

CREATE OR REPLACE FUNCTION create_room(p_room_code TEXT, p_creator_username TEXT)
RETURNS TABLE(room_id INT, user_id INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
   DECLARE
     v_room_id INT;
     v_game_id INT;
     v_user_id INT;
   BEGIN
     -- Create the room
     INSERT INTO rooms (name, player_count)
     VALUES (p_room_code, 1)
     RETURNING id INTO v_room_id;

     -- Get the user ID
     SELECT id INTO v_user_id
     FROM users
     WHERE username = p_creator_username;

     -- If user doesn't exist, create a new user
     IF v_user_id IS NULL THEN
       INSERT INTO users (username)
       VALUES (p_creator_username)
       RETURNING id INTO v_user_id;
     END IF;

     -- Create a game for this room
     INSERT INTO games (room_id, creator_id, target_score, time_limit)
     VALUES (v_room_id, v_user_id, 10, 60)  -- Adjust target_score and time_limit as needed
     RETURNING id INTO v_game_id;

     -- Add the creator to game_players
     INSERT INTO game_players (game_id, user_id, score)
     VALUES (v_game_id, v_user_id, 0);

     -- Return both room_id and user_id
     RETURN QUERY SELECT v_room_id, v_user_id;
   END;
   $$;