export interface User {
  id: number;
  username: string;
}

export interface GamePlayer {
  id: number;
  score: number;
  user_id: number;
  users: User;
}

export interface Player {
  id: number;
  username: string;
  score: number;
}

export interface Room {
  id: number;
  name: string;
  games: GameType[];
}

export interface Item {
  id: number;
  question: string;
  // Add other item properties as needed
}

export interface GameType {
  id: number;
  room_id: number;
  creator_id: number;
  target_score: number;
  time_limit: number | null;
  state: "waiting" | "active" | "finished";
  created_at: string;
  updated_at: string;
}
