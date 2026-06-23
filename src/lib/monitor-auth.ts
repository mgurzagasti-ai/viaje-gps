import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MonitorAccount, MonitorAuthSession } from "./types";
import {
  authenticateMonitorAccount,
  createMonitorAccount,
  getMonitorAccountById,
} from "./store";

const MONITOR_SESSION_COOKIE = "monitor_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getConfiguredSessionSecret() {
  return process.env.MONITOR_SESSION_SECRET?.trim();
}

export function getMonitorConfigStatus() {
  const sessionSecret = getConfiguredSessionSecret();

  return {
    isConfigured: Boolean(sessionSecret || !isProduction()),
    sessionSecret,
  };
}

function getSessionSecret() {
  const configuredSessionSecret = getConfiguredSessionSecret();

  if (configuredSessionSecret) {
    return configuredSessionSecret;
  }

  if (isProduction()) {
    throw new Error("MONITOR_SESSION_SECRET is required in production.");
  }

  return "viaje-gps-monitor-local";
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encodePayload(payload: object) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function buildSessionValue(account: MonitorAccount, authSession?: MonitorAuthSession | null) {
  const payload = encodePayload({
    accountId: account.id,
    username: account.username,
    authUserId: account.authUserId ?? null,
    authSession: authSession ?? null,
  });
  return `${payload}.${signValue(payload)}`;
}

async function readSessionAccount() {
  const cookieStore = await cookies();
  const session = cookieStore.get(MONITOR_SESSION_COOKIE)?.value;

  if (!session) {
    return null;
  }

  const separator = session.lastIndexOf(".");

  if (separator < 0) {
    return null;
  }

  const payload = session.slice(0, separator);
  const signature = session.slice(separator + 1);

  if (!signature || !payload) {
    return null;
  }

  const expected = signValue(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  const decoded = decodePayload<{
    accountId: string;
    username: string;
    authUserId?: string | null;
    authSession?: MonitorAuthSession | null;
  }>(payload);

  const account = await getMonitorAccountById(decoded.accountId);

  if (!account || account.username !== decoded.username) {
    return null;
  }

  return {
    account,
    authSession: decoded.authSession ?? null,
  };
}

export async function authenticateMonitor(username: string, password: string) {
  if (isProduction() && !getMonitorConfigStatus().isConfigured) {
    return null;
  }

  return authenticateMonitorAccount(username, password);
}

export async function registerMonitor(input: {
  name: string;
  username: string;
  password: string;
}) {
  if (isProduction() && !getMonitorConfigStatus().isConfigured) {
    return { error: "server-not-configured" as const };
  }

  return createMonitorAccount(input);
}

export async function createMonitorSession(
  account: MonitorAccount,
  authSession?: MonitorAuthSession | null,
) {
  const cookieStore = await cookies();

  cookieStore.set(MONITOR_SESSION_COOKIE, buildSessionValue(account, authSession), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearMonitorSession() {
  const cookieStore = await cookies();
  cookieStore.delete(MONITOR_SESSION_COOKIE);
}

export async function isMonitorAuthenticated() {
  if (isProduction() && !getMonitorConfigStatus().isConfigured) {
    return false;
  }

  return Boolean(await readSessionAccount());
}

export async function getAuthenticatedMonitor() {
  if (isProduction() && !getMonitorConfigStatus().isConfigured) {
    return null;
  }

  const session = await readSessionAccount();
  return session?.account ?? null;
}

export async function getAuthenticatedMonitorSession() {
  if (isProduction() && !getMonitorConfigStatus().isConfigured) {
    return null;
  }

  return readSessionAccount();
}

export async function requireMonitorAuthentication() {
  const account = await getAuthenticatedMonitor();

  if (!account) {
    redirect("/?error=unauthorized");
  }

  return account;
}
