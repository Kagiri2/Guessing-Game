DROP FUNCTION IF EXISTS join_room(text, text);

CREATE OR REPLACE FUNCTION join_room(p_room_code text, p_username text)
RETURNS TABLE(joined_user_id INT, joined_room_id INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id INT;
  v_player_count INT;
  v_user_id INT;
  v_game_id INT;
BEGIN
  -- Get the room ID and current player count
  SELECT id, player_count INTO v_room_id, v_player_count
  FROM rooms
  WHERE name = p_room_code;

  -- Check if the room exists
  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check if the room is full (assuming max 4 players)
  IF v_player_count >= 4 THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Get the user ID from the username
  SELECT id INTO v_user_id
  FROM users
  WHERE username = p_username;

  -- If user doesn't exist, create a new user
  IF v_user_id IS NULL THEN
    INSERT INTO users (username)
    VALUES (p_username)
    RETURNING id INTO v_user_id;
  END IF;

  -- Increment the player count
  UPDATE rooms
  SET player_count = player_count + 1
  WHERE id = v_room_id;

  -- Get the game ID for this room
  SELECT id INTO v_game_id
  FROM games
  WHERE room_id = v_room_id;

  -- Add the player to the game_players table
  INSERT INTO game_players (game_id, user_id, score)
  VALUES (v_game_id, v_user_id, 0);

  -- Return the user_id and room_id with different names
  RETURN QUERY SELECT v_user_id AS joined_user_id, v_room_id AS joined_room_id;
END;
$$;