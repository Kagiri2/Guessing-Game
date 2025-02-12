-- Supabase AI is experimental and may produce incorrect answers
-- Always verify the output before executing

drop function if exists leave_room (text, text);

create
or replace function leave_room (p_room_code text, p_username text) returns table (
  success boolean,
  removed_username text,
  remaining_player_count integer
) language plpgsql security definer as $$
DECLARE
    v_room_id INT;
    v_game_id INT;
    v_user_id INT;
    v_player_count INT;
    v_removed_username TEXT;
BEGIN
    -- Get the room ID
    SELECT id INTO v_room_id FROM rooms WHERE name = p_room_code;
    IF v_room_id IS NULL THEN
        RAISE EXCEPTION 'Room not found';
    END IF;
    
    -- Get the user ID
    SELECT id INTO v_user_id FROM users WHERE username = p_username;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Get the game ID
    SELECT id INTO v_game_id FROM games WHERE room_id = v_room_id;
    IF v_game_id IS NULL THEN
        RAISE EXCEPTION 'Game not found';
    END IF;
    
    -- Remove the player from game_players and store the removed username
    DELETE FROM game_players 
    WHERE game_id = v_game_id AND user_id = v_user_id
    RETURNING (SELECT username FROM users WHERE id = user_id) INTO v_removed_username;
    
    IF v_removed_username IS NULL THEN
        RAISE EXCEPTION 'Player not found in the game';
    END IF;
    
    -- Decrement the player count
    UPDATE rooms SET player_count = player_count - 1 WHERE id = v_room_id RETURNING player_count INTO v_player_count;
    
    -- If no players left, delete the room and associated game
    IF v_player_count = 0 THEN
        DELETE FROM games WHERE room_id = v_room_id;
        DELETE FROM rooms WHERE id = v_room_id;
    END IF;
    
    RETURN QUERY SELECT TRUE AS success, v_removed_username AS removed_username, v_player_count AS remaining_player_count;
END;
$$;