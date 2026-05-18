const fallbackUrl = "http://192.168.0.10:3000";

export function getDefaultApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackUrl;
}
