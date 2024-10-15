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
    games: { id: number }[];
  }
  
  export interface Item {
    id: number;
    question: string;
    // Add other item properties as needed
  }