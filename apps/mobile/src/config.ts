const fallbackUrl = "https://viaje-gps.vercel.app";

export function getDefaultApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackUrl;
}
