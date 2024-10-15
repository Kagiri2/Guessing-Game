import { supabase } from "../services/supabaseClient";

export async function checkAndDeleteEmptyRoom(roomCode: string): Promise<boolean> {
  const { data: players, error: playersError } = await supabase
    .from('game_players')
    .select('id')
    .eq('room_code', roomCode);

  if (playersError) {
    console.error('Error checking room players:', playersError);
    return false;
  }

  if (players.length === 0) {
    const { error: deleteError } = await supabase
      .from('rooms')
      .delete()
      .eq('name', roomCode);

    if (deleteError) {
      console.error('Error deleting empty room:', deleteError);
      return false;
    }

    console.log(`Empty room ${roomCode} deleted`);
    return true;
  }

  return false;
}