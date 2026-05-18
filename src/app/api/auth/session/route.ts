import { NextResponse } from "next/server";
import { createSession, getSeedCredentials } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    message: "Use POST to create a demo session.",
    seed: await getSeedCredentials(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    tripCode?: string;
  };

  if (!body.userId || !body.tripCode) {
    return NextResponse.json(
      { error: "userId and tripCode are required." },
      { status: 400 },
    );
  }

  const session = await createSession({
    userId: body.userId,
    tripCode: body.tripCode,
  });

  if (!session) {
    return NextResponse.json(
      { error: "Invalid user or trip code." },
      { status: 401 },
    );
  }

  return NextResponse.json(session, { status: 201 });
}
