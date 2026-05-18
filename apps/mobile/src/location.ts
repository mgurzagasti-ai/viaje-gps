import * as Location from "expo-location";
import { LocationPayload } from "./types";

function getSignalStrength(accuracy: number): LocationPayload["signalStrength"] {
  if (accuracy <= 10) {
    return "high";
  }

  if (accuracy <= 25) {
    return "medium";
  }

  return "low";
}

export async function readCurrentLocation(): Promise<LocationPayload> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Se necesita permiso de ubicacion para compartir posicion.");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const accuracy = position.coords.accuracy ?? 0;

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy,
    speed: Math.max(0, Math.round((position.coords.speed ?? 0) * 3.6)),
    batteryLevel: 100,
    signalStrength: getSignalStrength(accuracy),
    recordedAt: new Date().toISOString(),
  };
}
