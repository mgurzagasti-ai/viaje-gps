import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ConnectionStatus,
  CreateLocationInput,
  CreateSessionInput,
  CreateTripInput,
  LocationRecord,
  Session,
  TravelerSnapshot,
  Trip,
  TripDashboard,
  TripMember,
  User,
} from "./types";

interface PersistedState {
  users: User[];
  trips: Trip[];
  tripMembers: TripMember[];
  locations: LocationRecord[];
  sessions: Session[];
}

const storageDir = path.join(process.cwd(), "data");
const storageFile = path.join(storageDir, "tracker-store.json");

const seedState: PersistedState = {
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
  sessions: [],
};

let writeQueue: Promise<void> = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
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
  return JSON.parse(contents) as PersistedState;
}

async function writeState(state: PersistedState) {
  await ensureStorage();
  writeQueue = writeQueue.then(() =>
    writeFile(storageFile, JSON.stringify(state, null, 2), "utf8"),
  );
  await writeQueue;
}

function getLatestLocation(state: PersistedState, userId: string, tripId: string) {
  return state.locations
    .filter((item) => item.userId === userId && item.tripId === tripId)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null;
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
  };
}

function buildRecentEvents(state: PersistedState, tripId: string) {
  return state.tripMembers
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
}

export async function createSession(input: CreateSessionInput) {
  const state = await readState();
  const trip = state.trips.find((item) => item.code === input.tripCode);
  const normalizedUserName = input.userName?.trim().toLocaleLowerCase("es-AR");
  const normalizedUserPhone = input.userPhone?.trim();
  let user = input.userId
    ? state.users.find((item) => item.id === input.userId)
    : normalizedUserName
      ? state.users.find(
          (item) => item.name.trim().toLocaleLowerCase("es-AR") === normalizedUserName,
        )
      : null;

  if (!trip) {
    return null;
  }

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
    .filter((trip): trip is Trip => Boolean(trip));
}

export async function getTripDashboard(tripId: string): Promise<TripDashboard | null> {
  const state = await readState();
  const trip = state.trips.find((item) => item.id === tripId);

  if (!trip) {
    return null;
  }

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

  return {
    trip,
    members,
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

export async function getSeedCredentials() {
  const state = await readState();
  return {
    tripCode: state.trips[0]?.code ?? "",
    trips: state.trips
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((trip) => ({
        id: trip.id,
        name: trip.name,
        code: trip.code,
        origin: trip.origin,
        destination: trip.destination,
        checkpoint: trip.checkpoint,
        status: trip.status,
        startsAt: trip.startsAt,
      })),
    demoUsers: state.users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
    })),
  };
}

export async function getAllTrips() {
  const state = await readState();
  return state.trips.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

export async function createTrip(input: CreateTripInput) {
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
  };

  state.trips.push(trip);
  await writeState(state);

  return { trip };
}
