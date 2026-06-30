import { DashboardResponse, UserRole } from "./types";

export function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function compareNames(left: string, right: string) {
  return normalizeSearchText(left).localeCompare(normalizeSearchText(right));
}

export function roleLabel(role: UserRole) {
  if (role === "driver") {
    return "Conductor";
  }

  if (role === "coordinator") {
    return "Coordinacion";
  }

  if (role === "support") {
    return "Apoyo";
  }

  return "Viajero";
}

export function statusLabel(status: DashboardResponse["members"][number]["connectionStatus"]) {
  if (status === "online") {
    return "En linea";
  }

  if (status === "delayed") {
    return "Demorado";
  }

  return "Sin conexion";
}

export function statusTone(status: DashboardResponse["members"][number]["connectionStatus"]) {
  if (status === "online") {
    return {
      backgroundColor: "rgba(41,194,127,0.18)",
      borderColor: "rgba(41,194,127,0.32)",
      color: "#8ef0b9",
    };
  }

  if (status === "delayed") {
    return {
      backgroundColor: "rgba(255,184,77,0.16)",
      borderColor: "rgba(255,184,77,0.3)",
      color: "#ffd485",
    };
  }

  return {
    backgroundColor: "rgba(255,107,107,0.16)",
    borderColor: "rgba(255,107,107,0.28)",
    color: "#ffb2b2",
  };
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
