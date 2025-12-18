
export type Role = 'user' | 'model';

export interface Message {
  role: Role;
  text: string;
  timestamp: Date;
}

export interface UserPreferences {
  primaryGoal: string;
  preferredCloud: string;
  skillLevel: string;
  interestFocus: string;
}
