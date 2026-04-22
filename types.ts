
export type Availability = 'YES' | 'NO' | '不確定';

export interface MartialArts {
  name: string;
  color: string;
}

export interface Player {
  id: string;
  gameId: string;
  martialArts: string[];
  satAvailability: Availability;
  sunAvailability: Availability;
  notes: string;
  team: string;
  createdAt: number;
  projectId: string;
}

export interface TeamConfig {
  name: string;
  role: string;
  mission: string;
  details: string;
}

export interface Technique {
  genre: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail?: string;
  createdAt: number;
  expirationDate?: number; // Expiration timestamp
  martialArts: MartialArts[];
  teams: string[];
  teamDescriptions: Record<string, TeamConfig>;
  techniques: Technique[];
  playerCount?: number;
  isPremium?: boolean;
  isRestricted?: boolean; // Administrative lock
  restrictionMessage?: string; // Reason for restriction
  ownerMessage?: string; // Message from owner to admin
}

export interface UserProfile {
  uid: string;
  email: string | null;
  plan: 'free' | 'pro';
  maxProjects?: number; // Configurable by admin
  createdAt: number;
}

export interface AppConfig {
  martialArts: MartialArts[];
  teams: string[];
  availabilityOptions: Availability[];
}
