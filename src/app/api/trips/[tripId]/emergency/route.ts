import { NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/auth";
import { createEmergencyAlert } from "@/lib/store";
import { CreateEmergencyAlertInput } from "@/lib/types";

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

  const body = (await request.json()) as Partial<CreateEmergencyAlertInput>;

  if (body.type !== "accident" && body.type !== "sos") {
    return NextResponse.json(
      { error: "Invalid emergency alert payload." },
      { status: 400 },
    );
  }

  const alert = await createEmergencyAlert(session.token, {
    type: body.type,
    message: body.message,
  });

  if (!alert) {
    return NextResponse.json(
      { error: "Unable to store emergency alert." },
      { status: 400 },
    );
  }

  return NextResponse.json(alert, { status: 201 });
}
