export type UserRole = "coordinator" | "driver" | "support" | "traveler";

export type TripStatus = "planned" | "active" | "paused" | "completed";

export type ConnectionStatus = "online" | "delayed" | "offline";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface Trip {
  id: string;
  name: string;
  code: string;
  status: TripStatus;
  startsAt: string;
  origin: string;
  destination: string;
  checkpoint: string;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  memberRole: UserRole;
  joinedAt: string;
}

export interface LocationRecord {
  id: string;
  tripId: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  batteryLevel: number;
  signalStrength: "high" | "medium" | "low";
  recordedAt: string;
  source: "mobile";
}

export interface Session {
  token: string;
  userId: string;
  tripId: string;
  createdAt: string;
}

export interface TravelerSnapshot {
  userId: string;
  name: string;
  role: UserRole;
  phone: string;
  connectionStatus: ConnectionStatus;
  latestLocation: LocationRecord | null;
}

export interface TripDashboard {
  trip: Trip;
  members: TravelerSnapshot[];
  recentEvents: string[];
  summary: {
    activeTravelers: number;
    delayedTravelers: number;
    averageBattery: number;
    latestUpdateSeconds: number;
  };
}

export interface CreateSessionInput {
  userId: string;
  tripCode: string;
}

export interface CreateLocationInput {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  batteryLevel: number;
  signalStrength: "high" | "medium" | "low";
  recordedAt?: string;
}
