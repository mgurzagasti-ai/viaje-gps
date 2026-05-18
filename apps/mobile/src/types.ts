export type UserRole = "coordinator" | "driver" | "support" | "traveler";

export interface DemoSeedResponse {
  message: string;
  seed: {
    tripCode: string;
    demoUsers: Array<{
      id: string;
      name: string;
      role: UserRole;
    }>;
  };
}

export interface SessionResponse {
  token: string;
  user: {
    id: string;
    name: string;
    phone: string;
    role: UserRole;
  };
  trip: {
    id: string;
    name: string;
    code: string;
    status: "planned" | "active" | "paused" | "completed";
    startsAt: string;
    origin: string;
    destination: string;
    checkpoint: string;
  };
}

export interface DashboardResponse {
  trip: SessionResponse["trip"];
  members: Array<{
    userId: string;
    name: string;
    role: UserRole;
    phone: string;
    connectionStatus: "online" | "delayed" | "offline";
    latestLocation: {
      id: string;
      latitude: number;
      longitude: number;
      accuracy: number;
      speed: number;
      batteryLevel: number;
      signalStrength: "high" | "medium" | "low";
      recordedAt: string;
    } | null;
  }>;
  recentEvents: string[];
  summary: {
    activeTravelers: number;
    delayedTravelers: number;
    averageBattery: number;
    latestUpdateSeconds: number;
  };
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  batteryLevel: number;
  signalStrength: "high" | "medium" | "low";
  recordedAt?: string;
}
