drop function if exists start_new_round (text, text);

CREATE OR REPLACE FUNCTION start_new_round(p_game_id INT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_category_id INT;
    v_item JSONB;
    v_time_limit INT;
BEGIN
    -- Get the category_id and time_limit for the game
    SELECT category_id, time_limit INTO v_category_id, v_time_limit FROM games WHERE id = p_game_id;

    -- Get a random item from the category
    SELECT json_build_object(
        'id', i.id,
        'question', i.question,
        'answer', i.answer,
        'image_url', i.image_url
    ) INTO v_item
    FROM items i
    WHERE i.category_id = v_category_id
    ORDER BY RANDOM()
    LIMIT 1;

    -- Update the game with the new item and round start time
    UPDATE games
    SET current_item = v_item,
        round_start_time = NOW(),
        time_limit = v_time_limit  -- Ensure time_limit is set
    WHERE id = p_game_id;

    -- Return both the item and the round start time
    RETURN json_build_object(
        'item', v_item,
        'round_start_time', NOW()::text,
        'time_limit', v_time_limit
    );
END;
$$;