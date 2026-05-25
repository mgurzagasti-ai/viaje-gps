import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const MONITOR_SESSION_COOKIE = "monitor_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getConfiguredUsername() {
  return process.env.MONITOR_USERNAME?.trim();
}

function getConfiguredPassword() {
  return process.env.MONITOR_PASSWORD?.trim();
}

function getConfiguredSessionSecret() {
  return process.env.MONITOR_SESSION_SECRET?.trim();
}

export function getMonitorConfigStatus() {
  const username = getConfiguredUsername();
  const password = getConfiguredPassword();
  const sessionSecret = getConfiguredSessionSecret();

  return {
    isConfigured: Boolean(username && password && sessionSecret),
    username,
    password,
    sessionSecret,
  };
}

function getMonitorUsername() {
  const configuredUsername = getConfiguredUsername();

  if (configuredUsername) {
    return configuredUsername;
  }

  if (isProduction()) {
    throw new Error("MONITOR_USERNAME is required in production.");
  }

  return "viaje-gps";
}

function getMonitorPassword() {
  const configuredPassword = getConfiguredPassword();

  if (configuredPassword) {
    return configuredPassword;
  }

  if (isProduction()) {
    throw new Error("MONITOR_PASSWORD is required in production.");
  }

  return "viaje123";
}

function getSessionSecret() {
  const configuredSessionSecret = getConfiguredSessionSecret();

  if (configuredSessionSecret) {
    return configuredSessionSecret;
  }

  if (isProduction()) {
    throw new Error("MONITOR_SESSION_SECRET is required in production.");
  }

  return `${getMonitorUsername()}:${getMonitorPassword()}:viaje-gps-monitor`;
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function buildSessionValue(username: string) {
  return `${username}.${signValue(username)}`;
}

function isValidSessionValue(value: string) {
  const [username, signature] = value.split(".");

  if (!username || !signature) {
    return false;
  }

  const expected = signValue(username);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer) && username === getMonitorUsername();
}

export async function authenticateMonitor(username: string, password: string) {
  if (isProduction() && !getMonitorConfigStatus().isConfigured) {
    return false;
  }

  return username === getMonitorUsername() && password === getMonitorPassword();
}

export async function createMonitorSession() {
  const cookieStore = await cookies();

  cookieStore.set(MONITOR_SESSION_COOKIE, buildSessionValue(getMonitorUsername()), {
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

  const cookieStore = await cookies();
  const session = cookieStore.get(MONITOR_SESSION_COOKIE)?.value;

  if (!session) {
    return false;
  }

  return isValidSessionValue(session);
}

export async function requireMonitorAuthentication() {
  if (!(await isMonitorAuthenticated())) {
    redirect("/?error=unauthorized");
  }
}
