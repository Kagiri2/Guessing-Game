CREATE OR REPLACE FUNCTION get_oldest_player_in_room(p_room_code VARCHAR(50))
RETURNS TABLE (username VARCHAR(50), is_oldest BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  WITH room_players AS (
    SELECT u.username, gp.created_at
    FROM users u
    JOIN game_players gp ON u.id = gp.user_id
    JOIN games g ON gp.game_id = g.id
    JOIN rooms r ON g.room_id = r.id
    WHERE r.name = p_room_code
  ),
  oldest_join_time AS (
    SELECT MIN(created_at) as oldest_time
    FROM room_players
  )
  SELECT rp.username, rp.created_at = ojt.oldest_time as is_oldest
  FROM room_players rp, oldest_join_time ojt;
END;
$$ LANGUAGE plpgsql;