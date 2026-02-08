export interface Profile {
  id: string;
  user_id?: string;
  display_name: string;
  age: number;
  gender: string;
  bio: string;
  avatar_url: string;
  location: string;
  looking_for: string;
  interests: string[];
  compatibility_score: number;
  online_status: boolean;
  type: "human" | "ai";
}
