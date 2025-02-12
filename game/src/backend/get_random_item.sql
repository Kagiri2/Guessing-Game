CREATE OR REPLACE FUNCTION get_random_item(category_id INT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  random_item JSONB;
BEGIN
  SELECT to_jsonb(items.*) INTO random_item
  FROM items
  WHERE items.category_id = $1
  ORDER BY RANDOM()
  LIMIT 1;
  
  RETURN random_item;
END;
$$;