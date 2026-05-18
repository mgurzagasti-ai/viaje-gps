import { headers } from "next/headers";
import { getSession } from "./store";

export async function getSessionFromHeaders() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return getSession(authHeader.slice("Bearer ".length));
}
