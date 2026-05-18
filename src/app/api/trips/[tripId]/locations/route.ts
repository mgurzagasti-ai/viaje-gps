import { NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/auth";
import { createLocation, getTripLocations } from "@/lib/store";
import { CreateLocationInput } from "@/lib/types";

export async function GET(
  _: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const session = await getSessionFromHeaders();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { tripId } = await context.params;

  if (session.tripId !== tripId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({
    locations: (await getTripLocations(tripId)).slice(0, 20),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const session = await getSessionFromHeaders();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { tripId } = await context.params;

  if (session.tripId !== tripId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json()) as Partial<CreateLocationInput>;

  if (
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number" ||
    typeof body.accuracy !== "number" ||
    typeof body.speed !== "number" ||
    typeof body.batteryLevel !== "number" ||
    (body.signalStrength !== "high" &&
      body.signalStrength !== "medium" &&
      body.signalStrength !== "low")
  ) {
    return NextResponse.json(
      { error: "Invalid location payload." },
      { status: 400 },
    );
  }

  const location = await createLocation(session.token, {
    latitude: body.latitude,
    longitude: body.longitude,
    accuracy: body.accuracy,
    speed: body.speed,
    batteryLevel: body.batteryLevel,
    signalStrength: body.signalStrength,
    recordedAt: body.recordedAt,
  });

  if (!location) {
    return NextResponse.json({ error: "Unable to store location." }, { status: 400 });
  }

  return NextResponse.json(location, { status: 201 });
}
