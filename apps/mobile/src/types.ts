export type UserRole = "coordinator" | "driver" | "support" | "traveler";

export interface DemoSeedResponse {
  message: string;
  seed: {
    trips: Array<{
      id: string;
      name: string;
      origin: string;
      destination: string;
      checkpoint: string;
      alternativeCheckpoints: string[];
      status: "planned" | "active" | "paused" | "completed";
      startsAt: string;
    }>;
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
    status: "planned" | "active" | "paused" | "completed";
    startsAt: string;
    origin: string;
    destination: string;
    checkpoint: string;
    alternativeCheckpoints: string[];
  };
}

export interface DashboardResponse {
  trip: SessionResponse["trip"];
  activeEmergencyAlerts: Array<{
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    type: "accident" | "sos";
    message: string;
    status: "active" | "resolved";
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
  }>;
  members: Array<{
    userId: string;
    name: string;
    role: UserRole;
    phone: string;
    connectionStatus: "online" | "delayed" | "offline";
    emergencyAlert: {
      id: string;
      tripId: string;
      userId: string;
      type: "accident" | "sos";
      message: string;
      status: "active" | "resolved";
      createdAt: string;
      updatedAt: string;
      resolvedAt: string | null;
    } | null;
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
    activeEmergencyAlerts: number;
  };
}

export interface EmergencyAlertResponse {
  id: string;
  tripId: string;
  userId: string;
  type: "accident" | "sos";
  message: string;
  status: "active" | "resolved";
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
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
