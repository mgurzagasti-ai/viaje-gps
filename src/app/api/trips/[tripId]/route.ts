import { NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/auth";
import { getTripDashboard } from "@/lib/store";
import { TripDashboard } from "@/lib/types";

function toMobileDashboardResponse(dashboard: TripDashboard) {
  return {
    ...dashboard,
    trip: {
      id: dashboard.trip.id,
      name: dashboard.trip.name,
      status: dashboard.trip.status,
      startsAt: dashboard.trip.startsAt,
      origin: dashboard.trip.origin,
      destination: dashboard.trip.destination,
      checkpoint: dashboard.trip.checkpoint,
      alternativeCheckpoints: dashboard.trip.alternativeCheckpoints,
    },
  };
}

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

  return NextResponse.json(toMobileDashboardResponse(dashboard));
}
