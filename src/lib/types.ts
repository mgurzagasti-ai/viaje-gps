export type UserRole = "coordinator" | "driver" | "support" | "traveler";

export type TripStatus = "planned" | "active" | "paused" | "completed";

export type ConnectionStatus = "online" | "delayed" | "offline";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface MonitorAccount {
  id: string;
  name: string;
  username: string;
  password: string;
  createdAt: string;
  authUserId?: string | null;
}

export interface MonitorAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
}

export interface MonitorAuthenticationResult {
  account: MonitorAccount;
  authSession?: MonitorAuthSession | null;
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
  alternativeCheckpoints: string[];
  ownerMonitorId: string;
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

export interface EmergencyAlert {
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
  emergencyAlert: EmergencyAlert | null;
}

export interface TripDashboard {
  trip: Trip;
  members: TravelerSnapshot[];
  activeEmergencyAlerts: Array<
    EmergencyAlert & {
      userName: string;
      userPhone: string;
    }
  >;
  recentEvents: string[];
  summary: {
    activeTravelers: number;
    delayedTravelers: number;
    averageBattery: number;
    latestUpdateSeconds: number;
    activeEmergencyAlerts: number;
  };
}

export interface CreateSessionInput {
  userId?: string;
  userName?: string;
  userPhone?: string;
  tripCode: string;
}

export interface MobileTripSummary {
  id: string;
  name: string;
  status: TripStatus;
  startsAt: string;
  origin: string;
  destination: string;
  checkpoint: string;
  alternativeCheckpoints: string[];
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

export interface CreateEmergencyAlertInput {
  type: "accident" | "sos";
  message?: string;
}

export interface CreateTripInput {
  name: string;
  code: string;
  origin: string;
  destination: string;
  checkpoint: string;
  alternativeCheckpoints?: string[];
  startsAt?: string;
}
