import {
  createEmergencyAlert as createEmergencyAlertLocal,
  createLocation as createLocationLocal,
  createSession as createSessionLocal,
  createTrip as createTripLocal,
  deleteTrip as deleteTripLocal,
  getAllTrips as getAllTripsLocal,
  getSeedCredentials as getSeedCredentialsLocal,
  getSession as getSessionLocal,
  getTripDashboard as getTripDashboardLocal,
  getTripLocations as getTripLocationsLocal,
  getTripMembers as getTripMembersLocal,
  getTripsForUser as getTripsForUserLocal,
} from "./store-local";
import {
  createEmergencyAlert as createEmergencyAlertSupabase,
  createLocation as createLocationSupabase,
  createSession as createSessionSupabase,
  createTrip as createTripSupabase,
  deleteTrip as deleteTripSupabase,
  getAllTrips as getAllTripsSupabase,
  getSeedCredentials as getSeedCredentialsSupabase,
  getSession as getSessionSupabase,
  getTripDashboard as getTripDashboardSupabase,
  getTripLocations as getTripLocationsSupabase,
  getTripMembers as getTripMembersSupabase,
  getTripsForUser as getTripsForUserSupabase,
  isSupabaseReady,
} from "./store-supabase";

export async function createSession(...args: Parameters<typeof createSessionLocal>) {
  return isSupabaseReady()
    ? createSessionSupabase(...args)
    : createSessionLocal(...args);
}

export async function getSession(...args: Parameters<typeof getSessionLocal>) {
  return isSupabaseReady() ? getSessionSupabase(...args) : getSessionLocal(...args);
}

export async function getTripsForUser(...args: Parameters<typeof getTripsForUserLocal>) {
  return isSupabaseReady()
    ? getTripsForUserSupabase(...args)
    : getTripsForUserLocal(...args);
}

export async function getTripDashboard(...args: Parameters<typeof getTripDashboardLocal>) {
  return isSupabaseReady()
    ? getTripDashboardSupabase(...args)
    : getTripDashboardLocal(...args);
}

export async function getTripMembers(...args: Parameters<typeof getTripMembersLocal>) {
  return isSupabaseReady()
    ? getTripMembersSupabase(...args)
    : getTripMembersLocal(...args);
}

export async function getTripLocations(...args: Parameters<typeof getTripLocationsLocal>) {
  return isSupabaseReady()
    ? getTripLocationsSupabase(...args)
    : getTripLocationsLocal(...args);
}

export async function createLocation(...args: Parameters<typeof createLocationLocal>) {
  return isSupabaseReady()
    ? createLocationSupabase(...args)
    : createLocationLocal(...args);
}

export async function createEmergencyAlert(
  ...args: Parameters<typeof createEmergencyAlertLocal>
) {
  return isSupabaseReady()
    ? createEmergencyAlertSupabase(...args)
    : createEmergencyAlertLocal(...args);
}

export async function getSeedCredentials(...args: Parameters<typeof getSeedCredentialsLocal>) {
  return isSupabaseReady()
    ? getSeedCredentialsSupabase(...args)
    : getSeedCredentialsLocal(...args);
}

export async function getAllTrips(...args: Parameters<typeof getAllTripsLocal>) {
  return isSupabaseReady() ? getAllTripsSupabase(...args) : getAllTripsLocal(...args);
}

export async function createTrip(...args: Parameters<typeof createTripLocal>) {
  return isSupabaseReady() ? createTripSupabase(...args) : createTripLocal(...args);
}

export async function deleteTrip(...args: Parameters<typeof deleteTripLocal>) {
  return isSupabaseReady() ? deleteTripSupabase(...args) : deleteTripLocal(...args);
}
