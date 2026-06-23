import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword, isPasswordHashed, verifyPassword } from "./passwords";
import {
  ConnectionStatus,
  CreateEmergencyAlertInput,
  CreateLocationInput,
  CreateSessionInput,
  CreateTripInput,
  EmergencyAlert,
  LocationRecord,
  MobileTripSummary,
  MonitorAccount,
  Session,
  TravelerSnapshot,
  Trip,
  TripDashboard,
  TripMember,
  User,
} from "./types";

interface PersistedState {
  monitorAccounts: MonitorAccount[];
  users: User[];
  trips: Trip[];
  tripMembers: TripMember[];
  locations: LocationRecord[];
  emergencyAlerts: EmergencyAlert[];
  sessions: Session[];
}

const storageDir = path.join(process.cwd(), "data");
const storageFile = path.join(storageDir, "tracker-store.json");

const seedState: PersistedState = {
  monitorAccounts: [
    {
      id: "mon_default",
      name: "Viaje GPS Demo",
      username: "viaje-gps",
      password: "viaje123",
      createdAt: "2026-05-18T16:50:00.000Z",
      authUserId: null,
    },
  ],
  users: [
    {
      id: "usr_lucia",
      name: "Lucia Fernandez",
      phone: "+54 388 455 1001",
      role: "driver",
    },
    {
      id: "usr_martin",
      name: "Martin Quiroga",
      phone: "+54 388 455 1002",
      role: "driver",
    },
    {
      id: "usr_camila",
      name: "Camila Ruiz",
      phone: "+54 388 455 1003",
      role: "driver",
    },
    {
      id: "usr_bruno",
      name: "Bruno Salas",
      phone: "+54 388 455 1004",
      role: "driver",
    },
  ],
  trips: [
    {
      id: "trip_jujuy_001",
      name: "Viaje Jujuy Norte",
      code: "JUJUY-2026",
      status: "active",
      startsAt: "2026-05-18T17:30:00.000Z",
      origin: "San Salvador de Jujuy",
      destination: "Humahuaca",
      checkpoint: "Termas de Reyes",
      alternativeCheckpoints: ["Yala", "Volcan"],
      ownerMonitorId: "mon_default",
    },
  ],
  tripMembers: [
    {
      id: "tm_1",
      tripId: "trip_jujuy_001",
      userId: "usr_lucia",
      memberRole: "driver",
      joinedAt: "2026-05-18T17:15:00.000Z",
    },
    {
      id: "tm_2",
      tripId: "trip_jujuy_001",
      userId: "usr_martin",
      memberRole: "driver",
      joinedAt: "2026-05-18T17:15:00.000Z",
    },
    {
      id: "tm_3",
      tripId: "trip_jujuy_001",
      userId: "usr_camila",
      memberRole: "driver",
      joinedAt: "2026-05-18T17:18:00.000Z",
    },
    {
      id: "tm_4",
      tripId: "trip_jujuy_001",
      userId: "usr_bruno",
      memberRole: "driver",
      joinedAt: "2026-05-18T17:20:00.000Z",
    },
  ],
  locations: [
    {
      id: "loc_1",
      tripId: "trip_jujuy_001",
      userId: "usr_lucia",
      latitude: -24.1785,
      longitude: -65.3126,
      accuracy: 6,
      speed: 45,
      batteryLevel: 82,
      signalStrength: "high",
      recordedAt: "2026-05-18T18:07:48.000Z",
      source: "mobile",
    },
    {
      id: "loc_2",
      tripId: "trip_jujuy_001",
      userId: "usr_martin",
      latitude: -24.121,
      longitude: -65.427,
      accuracy: 9,
      speed: 0,
      batteryLevel: 65,
      signalStrength: "medium",
      recordedAt: "2026-05-18T18:08:04.000Z",
      source: "mobile",
    },
    {
      id: "loc_3",
      tripId: "trip_jujuy_001",
      userId: "usr_camila",
      latitude: -24.045,
      longitude: -65.3921,
      accuracy: 5,
      speed: 38,
      batteryLevel: 91,
      signalStrength: "high",
      recordedAt: "2026-05-18T18:08:10.000Z",
      source: "mobile",
    },
    {
      id: "loc_4",
      tripId: "trip_jujuy_001",
      userId: "usr_bruno",
      latitude: -24.0902,
      longitude: -65.4782,
      accuracy: 18,
      speed: 12,
      batteryLevel: 48,
      signalStrength: "low",
      recordedAt: "2026-05-18T18:07:32.000Z",
      source: "mobile",
    },
  ],
  emergencyAlerts: [],
  sessions: [],
};

let writeQueue: Promise<void> = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeMonitorAccount(account: MonitorAccount): MonitorAccount {
  return {
    ...account,
    name: account.name?.trim() || account.username,
    username: account.username.trim(),
    password: account.password,
    createdAt: account.createdAt || nowIso(),
    authUserId: account.authUserId ?? null,
  };
}

function normalizeTrip(trip: Trip): Trip {
  return {
    ...trip,
    alternativeCheckpoints: trip.alternativeCheckpoints ?? [],
    ownerMonitorId: trip.ownerMonitorId ?? "mon_default",
  };
}

function normalizeState(parsed: Partial<PersistedState>): PersistedState {
  return {
    monitorAccounts:
      parsed.monitorAccounts && parsed.monitorAccounts.length > 0
        ? parsed.monitorAccounts.map(normalizeMonitorAccount)
        : seedState.monitorAccounts.map(normalizeMonitorAccount),
    users: parsed.users ?? [],
    trips: (parsed.trips ?? []).map(normalizeTrip),
    tripMembers: parsed.tripMembers ?? [],
    locations: parsed.locations ?? [],
    emergencyAlerts: parsed.emergencyAlerts ?? [],
    sessions: parsed.sessions ?? [],
  };
}

async function ensureStorage() {
  await mkdir(storageDir, { recursive: true });

  try {
    await readFile(storageFile, "utf8");
  } catch {
    await writeFile(storageFile, JSON.stringify(seedState, null, 2), "utf8");
  }
}

async function readState() {
  await ensureStorage();
  const contents = await readFile(storageFile, "utf8");
  const parsed = JSON.parse(contents) as Partial<PersistedState>;

  return normalizeState(parsed);
}

async function writeState(state: PersistedState) {
  await ensureStorage();
  writeQueue = writeQueue.then(() =>
    writeFile(storageFile, JSON.stringify(state, null, 2), "utf8"),
  );
  await writeQueue;
}

function findMonitorByUsername(state: PersistedState, username: string) {
  const normalizedUsername = username.trim().toLocaleLowerCase("es-AR");
  return (
    state.monitorAccounts.find(
      (item) => item.username.trim().toLocaleLowerCase("es-AR") === normalizedUsername,
    ) ?? null
  );
}

function getLatestLocation(state: PersistedState, userId: string, tripId: string) {
  return state.locations
    .filter((item) => item.userId === userId && item.tripId === tripId)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null;
}

function getActiveEmergencyAlert(state: PersistedState, userId: string, tripId: string) {
  return (
    state.emergencyAlerts
      .filter(
        (item) =>
          item.userId === userId && item.tripId === tripId && item.status === "active",
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

function deriveConnectionStatus(location: LocationRecord | null): ConnectionStatus {
  if (!location) {
    return "offline";
  }

  const ageSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(location.recordedAt).getTime()) / 1000),
  );

  if (ageSeconds <= 45) {
    return "online";
  }

  if (ageSeconds <= 120) {
    return "delayed";
  }

  return "offline";
}

function buildTravelerSnapshot(state: PersistedState, member: TripMember): TravelerSnapshot {
  const user = state.users.find((item) => item.id === member.userId);

  if (!user) {
    throw new Error(`User not found for member ${member.id}`);
  }

  const latestLocation = getLatestLocation(state, member.userId, member.tripId);

  return {
    userId: user.id,
    name: user.name,
    role: member.memberRole,
    phone: user.phone,
    connectionStatus: deriveConnectionStatus(latestLocation),
    latestLocation,
    emergencyAlert: getActiveEmergencyAlert(state, user.id, member.tripId),
  };
}

function buildRecentEvents(state: PersistedState, tripId: string) {
  const emergencyEvents = state.emergencyAlerts
    .filter((item) => item.tripId === tripId && item.status === "active")
    .map((alert) => {
      const user = state.users.find((item) => item.id === alert.userId);
      const time = new Date(alert.updatedAt).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `${time} - ALERTA ${alert.type === "accident" ? "ACCIDENTE" : "911"} de ${user?.name ?? "usuario"}: ${alert.message}.`;
    });

  const locationEvents = state.tripMembers
    .filter((member) => member.tripId === tripId)
    .map((member) => {
      const snapshot = buildTravelerSnapshot(state, member);
      const time = snapshot.latestLocation
        ? new Date(snapshot.latestLocation.recordedAt).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--";

      if (!snapshot.latestLocation) {
        return `${time} - ${snapshot.name} aun no envio ubicacion.`;
      }

      return `${time} - ${snapshot.name} reporto ubicacion con precision de ${snapshot.latestLocation.accuracy} m.`;
    })
    .sort()
    .reverse();

  return [...emergencyEvents, ...locationEvents].slice(0, 12);
}

function toMobileTripSummary(trip: Trip): MobileTripSummary {
  const normalizedTrip = normalizeTrip(trip);

  return {
    id: normalizedTrip.id,
    name: normalizedTrip.name,
    status: normalizedTrip.status,
    startsAt: normalizedTrip.startsAt,
    origin: normalizedTrip.origin,
    destination: normalizedTrip.destination,
    checkpoint: normalizedTrip.checkpoint,
    alternativeCheckpoints: normalizedTrip.alternativeCheckpoints,
  };
}

export async function authenticateMonitorAccount(username: string, password: string) {
  const state = await readState();
  const account = findMonitorByUsername(state, username);

  if (!account || !verifyPassword(password, account.password)) {
    return null;
  }

  if (!isPasswordHashed(account.password)) {
    account.password = hashPassword(password);
    await writeState(state);
  }

  return {
    account,
    authSession: null,
  };
}

export async function createMonitorAccount(input: {
  name: string;
  username: string;
  password: string;
}) {
  const state = await readState();
  const username = input.username.trim();

  if (!username) {
    return { error: "missing-username" as const };
  }

  if (!input.password.trim()) {
    return { error: "missing-password" as const };
  }

  if (findMonitorByUsername(state, username)) {
    return { error: "duplicate-username" as const };
  }

  const account: MonitorAccount = {
    id: id("mon"),
    name: input.name.trim() || username,
    username,
    password: hashPassword(input.password),
    createdAt: nowIso(),
    authUserId: null,
  };

  state.monitorAccounts.push(account);
  await writeState(state);

  return {
    account,
    authSession: null,
  };
}

export async function getMonitorAccountById(monitorId: string) {
  const state = await readState();
  return state.monitorAccounts.find((item) => item.id === monitorId) ?? null;
}

export async function createSession(input: CreateSessionInput) {
  const state = await readState();
  const tripMatch = state.trips.find((item) => item.code === input.tripCode);
  const normalizedUserName = input.userName?.trim().toLocaleLowerCase("es-AR");
  const normalizedUserPhone = input.userPhone?.trim();
  let user = input.userId
    ? state.users.find((item) => item.id === input.userId)
    : normalizedUserName
      ? state.users.find(
          (item) => item.name.trim().toLocaleLowerCase("es-AR") === normalizedUserName,
        )
      : null;

  if (!tripMatch) {
    return null;
  }

  const trip = normalizeTrip(tripMatch);

  if (!user && input.userName?.trim()) {
    user = {
      id: id("usr"),
      name: input.userName.trim(),
      phone: normalizedUserPhone || "Sin telefono",
      role: "driver",
    };
    state.users.push(user);
  }

  if (!user) {
    return null;
  }

  let membership = state.tripMembers.find(
    (item) => item.userId === user.id && item.tripId === trip.id,
  );

  if (!membership) {
    membership = {
      id: id("tm"),
      tripId: trip.id,
      userId: user.id,
      memberRole: "driver",
      joinedAt: nowIso(),
    };
    state.tripMembers.push(membership);
  } else if (membership.memberRole !== "driver") {
    membership.memberRole = "driver";
  }

  if (user.role !== "driver") {
    user.role = "driver";
  }

  if (normalizedUserPhone) {
    user.phone = normalizedUserPhone;
  }

  const session: Session = {
    token: id("sess"),
    userId: user.id,
    tripId: trip.id,
    createdAt: nowIso(),
  };

  state.sessions = state.sessions.filter(
    (item) => !(item.userId === user.id && item.tripId === trip.id),
  );
  state.sessions.push(session);
  await writeState(state);

  return {
    token: session.token,
    user,
    trip,
  };
}

export async function getSession(token: string | null) {
  if (!token) {
    return null;
  }

  const state = await readState();
  return state.sessions.find((item) => item.token === token) ?? null;
}

export async function getTripsForUser(userId: string) {
  const state = await readState();
  const memberships = state.tripMembers.filter((item) => item.userId === userId);

  return memberships
    .map((membership) => state.trips.find((trip) => trip.id === membership.tripId))
    .filter((trip): trip is Trip => Boolean(trip))
    .map(normalizeTrip);
}

export async function getTripDashboard(
  tripId: string,
  ownerMonitorId?: string,
): Promise<TripDashboard | null> {
  const state = await readState();
  const tripMatch = state.trips.find(
    (item) => item.id === tripId && (!ownerMonitorId || item.ownerMonitorId === ownerMonitorId),
  );

  if (!tripMatch) {
    return null;
  }

  const trip = normalizeTrip(tripMatch);

  const members = state.tripMembers
    .filter((item) => item.tripId === tripId)
    .map((item) => buildTravelerSnapshot(state, item));

  const latestTimestamps = members
    .map((member) => member.latestLocation?.recordedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse();

  const batteries = members
    .map((member) => member.latestLocation?.batteryLevel)
    .filter((value): value is number => typeof value === "number");

  const activeEmergencyAlerts = state.emergencyAlerts
    .filter((item) => item.tripId === tripId && item.status === "active")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((alert) => {
      const user = state.users.find((item) => item.id === alert.userId);

      return {
        ...alert,
        userName: user?.name ?? "usuario",
        userPhone: user?.phone ?? "Sin telefono",
      };
    });

  return {
    trip,
    members,
    activeEmergencyAlerts,
    recentEvents: buildRecentEvents(state, tripId).slice(0, 6),
    summary: {
      activeTravelers: members.filter((item) => item.connectionStatus === "online").length,
      delayedTravelers: members.filter((item) => item.connectionStatus === "delayed").length,
      averageBattery:
        batteries.length > 0
          ? Math.round(batteries.reduce((sum, value) => sum + value, 0) / batteries.length)
          : 0,
      latestUpdateSeconds: latestTimestamps[0]
        ? Math.max(
            0,
            Math.floor((Date.now() - new Date(latestTimestamps[0]).getTime()) / 1000),
          )
        : 0,
      activeEmergencyAlerts: activeEmergencyAlerts.length,
    },
  };
}

export async function getTripMembers(tripId: string) {
  const state = await readState();
  return state.tripMembers
    .filter((item) => item.tripId === tripId)
    .map((item) => buildTravelerSnapshot(state, item));
}

export async function getTripLocations(tripId: string) {
  const state = await readState();
  return state.locations
    .filter((item) => item.tripId === tripId)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export async function createLocation(sessionToken: string, input: CreateLocationInput) {
  const state = await readState();
  const session = state.sessions.find((item) => item.token === sessionToken);

  if (!session) {
    return null;
  }

  const location: LocationRecord = {
    id: id("loc"),
    tripId: session.tripId,
    userId: session.userId,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    speed: input.speed,
    batteryLevel: input.batteryLevel,
    signalStrength: input.signalStrength,
    recordedAt: input.recordedAt ?? nowIso(),
    source: "mobile",
  };

  state.locations.push(location);
  await writeState(state);

  return location;
}

export async function createEmergencyAlert(
  sessionToken: string,
  input: CreateEmergencyAlertInput,
) {
  const state = await readState();
  const session = state.sessions.find((item) => item.token === sessionToken);

  if (!session) {
    return null;
  }

  const existingAlert = getActiveEmergencyAlert(state, session.userId, session.tripId);
  const message =
    input.message?.trim() ||
    (input.type === "accident"
      ? "Accidente reportado desde la app."
      : "Pedido urgente de ayuda a la flota.");

  if (existingAlert) {
    existingAlert.type = input.type;
    existingAlert.message = message;
    existingAlert.updatedAt = nowIso();
    await writeState(state);
    return existingAlert;
  }

  const alert: EmergencyAlert = {
    id: id("alert"),
    tripId: session.tripId,
    userId: session.userId,
    type: input.type,
    message,
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    resolvedAt: null,
  };

  state.emergencyAlerts.push(alert);
  await writeState(state);

  return alert;
}

export async function resolveEmergencyAlert(alertId: string, ownerMonitorId?: string) {
  const state = await readState();
  const existingAlert = state.emergencyAlerts.find((alert) => alert.id === alertId);

  if (!existingAlert) {
    return { error: "alert-not-found" as const };
  }

  if (ownerMonitorId) {
    const trip = state.trips.find((item) => item.id === existingAlert.tripId);

    if (!trip || trip.ownerMonitorId !== ownerMonitorId) {
      return { error: "alert-not-found" as const };
    }
  }

  const resolvedAt = nowIso();
  existingAlert.status = "resolved";
  existingAlert.updatedAt = resolvedAt;
  existingAlert.resolvedAt = resolvedAt;

  await writeState(state);

  return { alertId };
}

export async function getSeedCredentials() {
  const state = await readState();
  return {
    demoUsers: state.users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
    })),
  };
}

export async function getAllTrips(ownerMonitorId?: string) {
  const state = await readState();
  return state.trips
    .filter((trip) => !ownerMonitorId || trip.ownerMonitorId === ownerMonitorId)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .map(normalizeTrip);
}

export async function createTrip(input: CreateTripInput, ownerMonitorId: string) {
  const state = await readState();
  const normalizedCode = input.code.trim().toLocaleUpperCase("es-AR");

  if (!normalizedCode) {
    return { error: "missing-code" as const };
  }

  const existingTrip = state.trips.find(
    (trip) => trip.code.trim().toLocaleUpperCase("es-AR") === normalizedCode,
  );

  if (existingTrip) {
    return { error: "duplicate-code" as const };
  }

  const trip: Trip = {
    id: id("trip"),
    name: input.name.trim(),
    code: normalizedCode,
    status: "active",
    startsAt: input.startsAt?.trim() ? new Date(input.startsAt).toISOString() : nowIso(),
    origin: input.origin.trim(),
    destination: input.destination.trim(),
    checkpoint: input.checkpoint.trim(),
    alternativeCheckpoints: (input.alternativeCheckpoints ?? [])
      .map((item) => item.trim())
      .filter(Boolean),
    ownerMonitorId,
  };

  state.trips.push(trip);
  await writeState(state);

  return { trip };
}

export async function deleteTrip(tripId: string, ownerMonitorId?: string) {
  const state = await readState();
  const existingTrip = state.trips.find(
    (trip) => trip.id === tripId && (!ownerMonitorId || trip.ownerMonitorId === ownerMonitorId),
  );

  if (!existingTrip) {
    return { error: "trip-not-found" as const };
  }

  state.trips = state.trips.filter((trip) => trip.id !== tripId);
  state.tripMembers = state.tripMembers.filter((member) => member.tripId !== tripId);
  state.locations = state.locations.filter((location) => location.tripId !== tripId);
  state.sessions = state.sessions.filter((session) => session.tripId !== tripId);
  state.emergencyAlerts = state.emergencyAlerts.filter((alert) => alert.tripId !== tripId);

  await writeState(state);

  return { tripId };
}

export function getTripSummariesForSeed(trips: Trip[]) {
  return trips.map(toMobileTripSummary);
}
