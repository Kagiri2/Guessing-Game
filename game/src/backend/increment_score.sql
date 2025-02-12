CREATE OR REPLACE FUNCTION increment_score(player_id INT, increment INT)
RETURNS INT AS $$
DECLARE
    new_score INT;
BEGIN
    UPDATE game_players
    SET score = score + increment
    WHERE id = player_id
    RETURNING score INTO new_score;

    RETURN new_score;
END;
$$ LANGUAGE plpgsql;