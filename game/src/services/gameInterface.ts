export interface User {
  id: number;
  username: string;
}

export interface GamePlayer {
  id: number;
  user_id: number;
  score: number;
  created_at: string;
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
  category_id: number;
  question: string;
  answer: string;
  image_url: string;
  created_at: string;
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
  category_id: number | null;
}
