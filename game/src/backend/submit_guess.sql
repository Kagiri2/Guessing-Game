CREATE OR REPLACE FUNCTION submit_guess(
  p_game_id INT,
  p_user_id INT,
  p_item_id INT,
  p_guessed_answer TEXT,
  p_is_correct BOOLEAN
) RETURNS JSONB AS $$
DECLARE
  v_game_player_id INT;
  v_result JSONB;
BEGIN
  -- Get the game_player_id
  SELECT id INTO v_game_player_id
  FROM game_players
  WHERE game_id = p_game_id AND user_id = p_user_id;

  IF v_game_player_id IS NULL THEN
    RAISE EXCEPTION 'Game player not found';
  END IF;

  -- Insert the guess
  INSERT INTO user_guesses (item_id, game_player_id, guessed_answer, correct)
  VALUES (p_item_id, v_game_player_id, p_guessed_answer, p_is_correct);

  -- Update score if the guess is correct
  IF p_is_correct THEN
    UPDATE game_players
    SET score = score + 10
    WHERE id = v_game_player_id;
  END IF;

  -- Fetch the updated game_player data
  SELECT jsonb_build_object(
    'game_player_id', gp.id,
    'score', gp.score,
    'correct', p_is_correct
  ) INTO v_result
  FROM game_players gp
  WHERE gp.id = v_game_player_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;