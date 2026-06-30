import { useEffect, useMemo, useState } from "react";
import {
  createSession,
  getSeed,
  getTripDashboard,
  sendEmergencyAlert,
  sendLocation,
} from "../api";
import { getDefaultApiBaseUrl } from "../config";
import { readCurrentLocation } from "../location";
import { compareNames, normalizeSearchText } from "../mobile-utils";
import { DashboardResponse, DemoSeedResponse, SessionResponse } from "../types";

export function useMobileClientState() {
  const autoSendIntervalMs = 30000;
  const [apiBaseUrl, setApiBaseUrl] = useState(getDefaultApiBaseUrl());
  const [seed, setSeed] = useState<DemoSeedResponse["seed"] | null>(null);
  const [tripCode, setTripCode] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingLocation, setSyncingLocation] = useState(false);
  const [sendingEmergency, setSendingEmergency] = useState(false);
  const [autoSharing, setAutoSharing] = useState(true);
  const [lastLocationSync, setLastLocationSync] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSeed() {
      setLoadingSeed(true);
      setError(null);

      try {
        const result = await getSeed(apiBaseUrl);

        if (active) {
          setSeed(result.seed);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo conectar con la API del monitor.",
          );
        }
      } finally {
        if (active) {
          setLoadingSeed(false);
        }
      }
    }

    void loadSeed();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const selectedUser = useMemo(
    () =>
      seed?.demoUsers.find(
        (item) => normalizeSearchText(item.name) === normalizeSearchText(loginName),
      ) ?? null,
    [loginName, seed],
  );

  const prioritizedMembers = useMemo(() => {
    if (!dashboard || !session) {
      return null;
    }

    const sorted = [...dashboard.members].sort((left, right) => {
      const leftPriority =
        left.userId === session.user.id ? 0 : left.role === "driver" ? 1 : 2;
      const rightPriority =
        right.userId === session.user.id ? 0 : right.role === "driver" ? 1 : 2;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return compareNames(left.name, right.name);
    });

    return {
      drivers: sorted.filter((member) => member.role === "driver"),
      others: sorted.filter((member) => member.role !== "driver"),
    };
  }, [dashboard, session]);

  async function refreshDashboard() {
    if (!session) {
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const result = await getTripDashboard(apiBaseUrl, session.token, session.trip.id);
      setDashboard(result);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "No se pudo actualizar el monitor.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function submitCurrentLocation(options?: { silent?: boolean }) {
    if (!session || syncingLocation) {
      return false;
    }

    const silent = options?.silent ?? false;
    setSyncingLocation(true);
    setError(null);

    if (!silent) {
      setFeedback(null);
    }

    try {
      const payload = await readCurrentLocation();
      await sendLocation(apiBaseUrl, session.token, session.trip.id, payload);
      setLastLocationSync(
        new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      await refreshDashboard();

      if (!silent) {
        setFeedback("Ubicacion enviada correctamente al monitor.");
      }

      return true;
    } catch (locationError) {
      setError(
        locationError instanceof Error
          ? locationError.message
          : "No se pudo enviar la ubicacion actual.",
      );
      return false;
    } finally {
      setSyncingLocation(false);
    }
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    const interval = setInterval(() => {
      void getTripDashboard(apiBaseUrl, session.token, session.trip.id)
        .then((result) => {
          setDashboard(result);
        })
        .catch((refreshError) => {
          setError(
            refreshError instanceof Error
              ? refreshError.message
              : "No se pudo actualizar el monitor.",
          );
        });
    }, 20000);

    return () => clearInterval(interval);
  }, [apiBaseUrl, session]);

  useEffect(() => {
    if (!session || !autoSharing) {
      return;
    }

    const interval = setInterval(() => {
      if (syncingLocation) {
        return;
      }

      void readCurrentLocation()
        .then((payload) =>
          sendLocation(apiBaseUrl, session.token, session.trip.id, payload),
        )
        .then(() => {
          setLastLocationSync(
            new Date().toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          );

          return getTripDashboard(apiBaseUrl, session.token, session.trip.id);
        })
        .then((result) => {
          setDashboard(result);
        })
        .catch((autoSyncError) => {
          setError(
            autoSyncError instanceof Error
              ? autoSyncError.message
              : "No se pudo enviar la ubicacion actual.",
          );
        });
    }, autoSendIntervalMs);

    return () => clearInterval(interval);
  }, [apiBaseUrl, autoSharing, session, syncingLocation]);

  async function handleLogin() {
    if (!loginName.trim() || !loginPhone.trim() || !tripCode.trim()) {
      setError("Ingresa el codigo del viaje y completa tu nombre y telefono.");
      return false;
    }

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await createSession(apiBaseUrl, {
        userName: loginName.trim(),
        userPhone: loginPhone.trim(),
        tripCode: tripCode.trim().toUpperCase(),
      });

      setSession(result);
      setFeedback("Sesion iniciada. Ya podes compartir tu ubicacion.");
      setLastLocationSync(null);
      setAutoSharing(true);

      const dashboardResult = await getTripDashboard(
        apiBaseUrl,
        result.token,
        result.trip.id,
      );
      setDashboard(dashboardResult);
      return true;
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "No se pudo crear la sesion del viaje.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmergencyAlert(type: "accident" | "sos") {
    if (!session || sendingEmergency) {
      return;
    }

    setSendingEmergency(true);
    setError(null);
    setFeedback(null);

    try {
      const payload = await readCurrentLocation();
      await sendLocation(apiBaseUrl, session.token, session.trip.id, payload);
      await sendEmergencyAlert(apiBaseUrl, session.token, session.trip.id, {
        type,
      });
      await refreshDashboard();
      setFeedback(
        type === "accident"
          ? "Alerta de accidente enviada a la flota."
          : "Pedido 911 enviado a la flota.",
      );
    } catch (emergencyError) {
      setError(
        emergencyError instanceof Error
          ? emergencyError.message
          : "No se pudo enviar la alerta de emergencia.",
      );
    } finally {
      setSendingEmergency(false);
    }
  }

  function handleReset() {
    setSession(null);
    setDashboard(null);
    setFeedback(null);
    setError(null);
    setLastLocationSync(null);
  }

  return {
    apiBaseUrl,
    autoSharing,
    dashboard,
    error,
    feedback,
    lastLocationSync,
    loadingSeed,
    loginName,
    loginPhone,
    prioritizedMembers,
    refreshing,
    seed,
    selectedUser,
    sendingEmergency,
    session,
    submitting,
    syncingLocation,
    tripCode,
    setApiBaseUrl,
    setAutoSharing,
    setFeedback,
    setLoginName,
    setLoginPhone,
    setTripCode,
    handleEmergencyAlert,
    handleLogin,
    handleReset,
    refreshDashboard,
    submitCurrentLocation,
  };
}
