import { NextResponse } from "next/server";
import { createSession, getSeedCredentials } from "@/lib/store";
import { Trip } from "@/lib/types";

function toMobileTrip(trip: Trip) {
  return {
    id: trip.id,
    name: trip.name,
    status: trip.status,
    startsAt: trip.startsAt,
    origin: trip.origin,
    destination: trip.destination,
    checkpoint: trip.checkpoint,
    alternativeCheckpoints: trip.alternativeCheckpoints,
  };
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to create a session with a trip code provided by the monitor.",
    seed: await getSeedCredentials(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    userName?: string;
    userPhone?: string;
    tripCode?: string;
  };

  if ((!body.userId && !body.userName) || !body.tripCode) {
    return NextResponse.json(
      { error: "userId or userName, and tripCode are required." },
      { status: 400 },
    );
  }

  const session = await createSession({
    userId: body.userId,
    userName: body.userName,
    userPhone: body.userPhone,
    tripCode: body.tripCode,
  });

  if (!session) {
    return NextResponse.json(
      { error: "Invalid user or trip code." },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      ...session,
      trip: toMobileTrip(session.trip),
    },
    { status: 201 },
  );
}
