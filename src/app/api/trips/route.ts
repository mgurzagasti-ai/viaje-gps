import { NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/auth";
import { getTripsForUser } from "@/lib/store";

export async function GET() {
  const session = await getSessionFromHeaders();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    trips: await getTripsForUser(session.userId),
  });
}
