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

type DbUser = {
  id: string;
  name: string;
  phone: string;
  role: User["role"];
};

type DbTrip = {
  id: string;
  name: string;
  code: string;
  status: Trip["status"];
  starts_at: string;
  origin: string;
  destination: string;
  checkpoint: string;
};

type DbTripMember = {
  id: string;
  trip_id: string;
  user_id: string;
  member_role: TripMember["memberRole"];
  joined_at: string;
};

type DbLocation = {
  id: string;
  trip_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  battery_level: number;
  signal_strength: LocationRecord["signalStrength"];
  recorded_at: string;
  source: LocationRecord["source"];
};

type DbSession = {
  token: string;
  user_id: string;
  trip_id: string;
  created_at: string;
};

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
  process.env.SUPABASE_ANON_KEY?.trim() ??
  "";

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
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

function toTrip(row: DbTrip): Trip {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status,
    startsAt: row.starts_at,
    origin: row.origin,
    destination: row.destination,
    checkpoint: row.checkpoint,
  };
}

function toLocation(row: DbLocation): LocationRecord {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    speed: row.speed,
    batteryLevel: row.battery_level,
    signalStrength: row.signal_strength,
    recordedAt: row.recorded_at,
    source: row.source,
  };
}

function toSession(row: DbSession): Session {
  return {
    token: row.token,
    userId: row.user_id,
    tripId: row.trip_id,
    createdAt: row.created_at,
  };
}

function toTripMember(row: DbTripMember): TripMember {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    memberRole: row.member_role,
    joinedAt: row.joined_at,
  };
}

function encodeIn(values: string[]) {
  return `(${values.map((value) => `"${value}"`).join(",")})`;
}

async function supabaseRequest<T>(
  path: string,
  init?: RequestInit & { prefer?: string },
): Promise<T> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...(init?.prefer ? { Prefer: init.prefer } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed for ${path}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function getUsersByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }

  return supabaseRequest<DbUser[]>(
    `users?select=id,name,phone,role&id=in.${encodeURIComponent(encodeIn(userIds))}`,
  );
}

async function getTripsByIds(tripIds: string[]) {
  if (tripIds.length === 0) {
    return [];
  }

  return supabaseRequest<DbTrip[]>(
    `trips?select=id,name,code,status,starts_at,origin,destination,checkpoint&id=in.${encodeURIComponent(encodeIn(tripIds))}`,
  );
}

async function getLatestLocationsForTrip(tripId: string) {
  const rows = await supabaseRequest<DbLocation[]>(
    `locations?select=id,trip_id,user_id,latitude,longitude,accuracy,speed,battery_level,signal_strength,recorded_at,source&trip_id=eq.${encodeURIComponent(tripId)}&order=recorded_at.desc`,
  );

  const latestByUser = new Map<string, LocationRecord>();

  for (const row of rows) {
    if (!latestByUser.has(row.user_id)) {
      latestByUser.set(row.user_id, toLocation(row));
    }
  }

  return latestByUser;
}

function buildTravelerSnapshot(
  user: User,
  member: TripMember,
  latestLocation: LocationRecord | null,
): TravelerSnapshot {
  return {
    userId: user.id,
    name: user.name,
    role: member.memberRole,
    phone: user.phone,
    connectionStatus: deriveConnectionStatus(latestLocation),
    latestLocation,
  };
}

function buildRecentEvents(members: TravelerSnapshot[]) {
  return members
    .map((snapshot) => {
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

async function getTripByCode(code: string) {
  const rows = await supabaseRequest<DbTrip[]>(
    `trips?select=id,name,code,status,starts_at,origin,destination,checkpoint&code=eq.${encodeURIComponent(code)}&limit=1`,
  );
  return rows[0] ? toTrip(rows[0]) : null;
}

async function getUserById(userId: string) {
  const rows = await supabaseRequest<DbUser[]>(
    `users?select=id,name,phone,role&id=eq.${encodeURIComponent(userId)}&limit=1`,
  );

  return rows[0] ?? null;
}

async function getUserByName(name: string) {
  const rows = await supabaseRequest<DbUser[]>(
    `users?select=id,name,phone,role&name=ilike.${encodeURIComponent(name)}&limit=1`,
  );

  return rows[0] ?? null;
}

export async function createSession(input: CreateSessionInput) {
  const trip = await getTripByCode(input.tripCode.trim().toLocaleUpperCase("es-AR"));
  const normalizedUserPhone = input.userPhone?.trim();
  let userRow = input.userId ? await getUserById(input.userId) : null;

  if (!userRow && input.userName?.trim()) {
    userRow = await getUserByName(input.userName.trim());
  }

  if (!trip) {
    return null;
  }

  if (!userRow && input.userName?.trim()) {
    const createdUsers = await supabaseRequest<DbUser[]>("users", {
      method: "POST",
      body: JSON.stringify([
        {
          id: id("usr"),
          name: input.userName.trim(),
          phone: normalizedUserPhone || "Sin telefono",
          role: "driver",
        },
      ]),
      prefer: "return=representation",
    });
    userRow = createdUsers[0] ?? null;
  }

  if (!userRow) {
    return null;
  }

  if (userRow.role !== "driver" || (normalizedUserPhone && userRow.phone !== normalizedUserPhone)) {
    const updatedUsers = await supabaseRequest<DbUser[]>(
      `users?id=eq.${encodeURIComponent(userRow.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          role: "driver",
          ...(normalizedUserPhone ? { phone: normalizedUserPhone } : {}),
        }),
        prefer: "return=representation",
      },
    );
    userRow = updatedUsers[0] ?? userRow;
  }

  const membershipRows = await supabaseRequest<DbTripMember[]>(
    `trip_members?select=id,trip_id,user_id,member_role,joined_at&trip_id=eq.${encodeURIComponent(trip.id)}&user_id=eq.${encodeURIComponent(userRow.id)}&limit=1`,
  );

  let membershipRow = membershipRows[0] ?? null;

  if (!membershipRow) {
    const createdMemberships = await supabaseRequest<DbTripMember[]>("trip_members", {
      method: "POST",
      body: JSON.stringify([
        {
          id: id("tm"),
          trip_id: trip.id,
          user_id: userRow.id,
          member_role: "driver",
          joined_at: nowIso(),
        },
      ]),
      prefer: "return=representation",
    });
    membershipRow = createdMemberships[0] ?? null;
  } else if (membershipRow.member_role !== "driver") {
    const updatedMemberships = await supabaseRequest<DbTripMember[]>(
      `trip_members?id=eq.${encodeURIComponent(membershipRow.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ member_role: "driver" }),
        prefer: "return=representation",
      },
    );
    membershipRow = updatedMemberships[0] ?? membershipRow;
  }

  await supabaseRequest<void>(
    `sessions?user_id=eq.${encodeURIComponent(userRow.id)}&trip_id=eq.${encodeURIComponent(trip.id)}`,
    {
      method: "DELETE",
    },
  );

  const createdSessions = await supabaseRequest<DbSession[]>("sessions", {
    method: "POST",
    body: JSON.stringify([
      {
        token: id("sess"),
        user_id: userRow.id,
        trip_id: trip.id,
        created_at: nowIso(),
      },
    ]),
    prefer: "return=representation",
  });

  const sessionRow = createdSessions[0];

  return {
    token: sessionRow.token,
    user: {
      id: userRow.id,
      name: userRow.name,
      phone: userRow.phone,
      role: "driver",
    },
    trip,
  };
}

export async function getSession(token: string | null) {
  if (!token) {
    return null;
  }

  const rows = await supabaseRequest<DbSession[]>(
    `sessions?select=token,user_id,trip_id,created_at&token=eq.${encodeURIComponent(token)}&limit=1`,
  );

  return rows[0] ? toSession(rows[0]) : null;
}

export async function getTripsForUser(userId: string) {
  const memberships = await supabaseRequest<DbTripMember[]>(
    `trip_members?select=id,trip_id,user_id,member_role,joined_at&user_id=eq.${encodeURIComponent(userId)}`,
  );

  const trips = await getTripsByIds(memberships.map((membership) => membership.trip_id));
  return trips.map(toTrip);
}

export async function getTripDashboard(tripId: string): Promise<TripDashboard | null> {
  const trips = await supabaseRequest<DbTrip[]>(
    `trips?select=id,name,code,status,starts_at,origin,destination,checkpoint&id=eq.${encodeURIComponent(tripId)}&limit=1`,
  );

  const tripRow = trips[0];

  if (!tripRow) {
    return null;
  }

  const membershipRows = await supabaseRequest<DbTripMember[]>(
    `trip_members?select=id,trip_id,user_id,member_role,joined_at&trip_id=eq.${encodeURIComponent(tripId)}`,
  );

  const users = await getUsersByIds(membershipRows.map((membership) => membership.user_id));
  const userMap = new Map(users.map((user) => [user.id, user]));
  const latestLocations = await getLatestLocationsForTrip(tripId);

  const members = membershipRows
    .map(toTripMember)
    .map((member) => {
      const user = userMap.get(member.userId);
      if (!user) {
        return null;
      }

      return buildTravelerSnapshot(
        {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        member,
        latestLocations.get(member.userId) ?? null,
      );
    })
    .filter((member): member is TravelerSnapshot => Boolean(member));

  const latestTimestamps = members
    .map((member) => member.latestLocation?.recordedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse();

  const batteries = members
    .map((member) => member.latestLocation?.batteryLevel)
    .filter((value): value is number => typeof value === "number");

  return {
    trip: toTrip(tripRow),
    members,
    recentEvents: buildRecentEvents(members).slice(0, 6),
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
  const dashboard = await getTripDashboard(tripId);
  return dashboard?.members ?? [];
}

export async function getTripLocations(tripId: string) {
  const rows = await supabaseRequest<DbLocation[]>(
    `locations?select=id,trip_id,user_id,latitude,longitude,accuracy,speed,battery_level,signal_strength,recorded_at,source&trip_id=eq.${encodeURIComponent(tripId)}&order=recorded_at.desc`,
  );

  return rows.map(toLocation);
}

export async function createLocation(sessionToken: string, input: CreateLocationInput) {
  const session = await getSession(sessionToken);

  if (!session) {
    return null;
  }

  const createdLocations = await supabaseRequest<DbLocation[]>("locations", {
    method: "POST",
    body: JSON.stringify([
      {
        id: id("loc"),
        trip_id: session.tripId,
        user_id: session.userId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        speed: input.speed,
        battery_level: input.batteryLevel,
        signal_strength: input.signalStrength,
        recorded_at: input.recordedAt ?? nowIso(),
        source: "mobile",
      },
    ]),
    prefer: "return=representation",
  });

  return createdLocations[0] ? toLocation(createdLocations[0]) : null;
}

export async function getSeedCredentials() {
  const trips = await getAllTrips();
  const users = await supabaseRequest<DbUser[]>("users?select=id,name,phone,role");

  return {
    tripCode: trips[0]?.code ?? "",
    trips: trips.map((trip) => ({
      id: trip.id,
      name: trip.name,
      code: trip.code,
      origin: trip.origin,
      destination: trip.destination,
      checkpoint: trip.checkpoint,
      status: trip.status,
      startsAt: trip.startsAt,
    })),
    demoUsers: users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
    })),
  };
}

export async function getAllTrips() {
  const rows = await supabaseRequest<DbTrip[]>(
    "trips?select=id,name,code,status,starts_at,origin,destination,checkpoint&order=starts_at.desc",
  );
  return rows.map(toTrip);
}

export async function createTrip(input: CreateTripInput) {
  const normalizedCode = input.code.trim().toLocaleUpperCase("es-AR");

  if (!normalizedCode) {
    return { error: "missing-code" as const };
  }

  const existingTrips = await supabaseRequest<DbTrip[]>(
    `trips?select=id,code&code=eq.${encodeURIComponent(normalizedCode)}&limit=1`,
  );

  if (existingTrips[0]) {
    return { error: "duplicate-code" as const };
  }

  const createdTrips = await supabaseRequest<DbTrip[]>("trips", {
    method: "POST",
    body: JSON.stringify([
      {
        id: id("trip"),
        name: input.name.trim(),
        code: normalizedCode,
        status: "active",
        starts_at: input.startsAt?.trim()
          ? new Date(input.startsAt).toISOString()
          : nowIso(),
        origin: input.origin.trim(),
        destination: input.destination.trim(),
        checkpoint: input.checkpoint.trim(),
      },
    ]),
    prefer: "return=representation",
  });

  return { trip: toTrip(createdTrips[0]) };
}

export function isSupabaseReady() {
  return Boolean(supabaseUrl && supabaseKey);
}
