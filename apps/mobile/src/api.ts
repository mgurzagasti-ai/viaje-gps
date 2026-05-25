import {
  DashboardResponse,
  DemoSeedResponse,
  EmergencyAlertResponse,
  LocationPayload,
  SessionResponse,
} from "./types";

async function request<T>(
  apiBaseUrl: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const normalizedBaseUrl = apiBaseUrl.trim().replace(/\/+$/, "");

  const response = await fetch(`${normalizedBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
}

export function getSeed(apiBaseUrl: string) {
  return request<DemoSeedResponse>(apiBaseUrl, "/api/auth/session");
}

export function createSession(
  apiBaseUrl: string,
  payload: {
    userId?: string;
    userName?: string;
    userPhone?: string;
    tripCode: string;
  },
) {
  return request<SessionResponse>(apiBaseUrl, "/api/auth/session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTripDashboard(
  apiBaseUrl: string,
  token: string,
  tripId: string,
) {
  return request<DashboardResponse>(apiBaseUrl, `/api/trips/${tripId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function sendLocation(
  apiBaseUrl: string,
  token: string,
  tripId: string,
  payload: LocationPayload,
) {
  return request(apiBaseUrl, `/api/trips/${tripId}/locations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function sendEmergencyAlert(
  apiBaseUrl: string,
  token: string,
  tripId: string,
  payload: {
    type: "accident" | "sos";
    message?: string;
  },
) {
  return request<EmergencyAlertResponse>(apiBaseUrl, `/api/trips/${tripId}/emergency`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
