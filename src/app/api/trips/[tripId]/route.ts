import { NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/auth";
import { getTripDashboard } from "@/lib/store";

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

  const dashboard = await getTripDashboard(tripId);

  if (!dashboard) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  return NextResponse.json(dashboard);
}
