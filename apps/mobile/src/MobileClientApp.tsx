import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createSession, getSeed, getTripDashboard, sendLocation } from "./api";
import { getDefaultApiBaseUrl } from "./config";
import { readCurrentLocation } from "./location";
import { TripGroupMap } from "./TripGroupMap";
import { DashboardResponse, DemoSeedResponse, SessionResponse } from "./types";

function statusLabel(status: DashboardResponse["members"][number]["connectionStatus"]) {
  if (status === "online") {
    return "En linea";
  }

  if (status === "delayed") {
    return "Demorado";
  }

  return "Sin conexion";
}

function statusChipStyle(
  status: DashboardResponse["members"][number]["connectionStatus"],
) {
  if (status === "online") {
    return [styles.statusChip, styles.statusOnline];
  }

  if (status === "delayed") {
    return [styles.statusChip, styles.statusDelayed];
  }

  return [styles.statusChip, styles.statusOffline];
}

function statusTextStyle(
  status: DashboardResponse["members"][number]["connectionStatus"],
) {
  if (status === "online") {
    return [styles.statusChipText, styles.statusOnlineText];
  }

  if (status === "delayed") {
    return [styles.statusChipText, styles.statusDelayedText];
  }

  return [styles.statusChipText, styles.statusOfflineText];
}

function roleLabel(role: DashboardResponse["members"][number]["role"]) {
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

export function MobileClientApp() {
  const autoSendIntervalMs = 30000;
  const [apiBaseUrl, setApiBaseUrl] = useState(getDefaultApiBaseUrl());
  const [seed, setSeed] = useState<DemoSeedResponse["seed"] | null>(null);
  const [selectedTripCode, setSelectedTripCode] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingLocation, setSyncingLocation] = useState(false);
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

        if (!active) {
          return;
        }

        setSeed(result.seed);
        setSelectedTripCode((value) => value || result.seed.trips[0]?.code || result.seed.tripCode);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo conectar con la API del monitor.",
        );
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
        (item) =>
          item.name.trim().toLocaleLowerCase("es-AR") ===
          loginName.trim().toLocaleLowerCase("es-AR"),
      ) ?? null,
    [loginName, seed],
  );

  const selectedTrip = useMemo(
    () => seed?.trips.find((trip) => trip.code === selectedTripCode) ?? null,
    [seed, selectedTripCode],
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

      return left.name.localeCompare(right.name, "es-AR");
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
    if (!loginName.trim() || !loginPhone.trim() || !selectedTripCode.trim()) {
      setError("Selecciona un viaje y completa tu nombre y telefono.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await createSession(apiBaseUrl, {
        userName: loginName.trim(),
        userPhone: loginPhone.trim(),
        tripCode: selectedTripCode.trim(),
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
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "No se pudo crear la sesion del viaje.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendLocation() {
    if (!session) {
      return;
    }

    await submitCurrentLocation();
  }

  function handleReset() {
    setSession(null);
    setDashboard(null);
    setFeedback(null);
    setError(null);
    setLastLocationSync(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.screen}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Viaje GPS · Cliente movil</Text>
            <Text style={styles.heroTitle}>
              Compartir posicion en tiempo real de forma clara y simple.
            </Text>
            <Text style={styles.heroBody}>
              App inicial para cada conductor o viajero, conectada al monitor web en
              Next.js.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Conexion</Text>
            <Text style={styles.cardTitle}>Configuracion del entorno</Text>

            <Text style={styles.label}>API base URL</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setApiBaseUrl}
              style={styles.input}
              value={apiBaseUrl}
            />

            <Text style={styles.helperText}>
              En telefono real usa la IP local de tu PC, por ejemplo
              {" "}
              `http://192.168.0.10:3000`.
            </Text>
          </View>

          {!session ? (
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>Acceso al viaje</Text>
              <Text style={styles.cardTitle}>Elegi un viaje y entra</Text>

              <Text style={styles.label}>Viajes disponibles</Text>
              <View style={styles.tripGrid}>
                {seed?.trips.map((trip) => {
                  const active = trip.code === selectedTripCode;

                  return (
                    <Pressable
                      key={trip.id}
                      onPress={() => setSelectedTripCode(trip.code)}
                      style={[styles.tripCard, active && styles.tripCardActive]}
                    >
                      <Text style={[styles.tripCardName, active && styles.tripCardNameActive]}>
                        {trip.name}
                      </Text>
                      <Text style={[styles.tripCardRoute, active && styles.tripCardRouteActive]}>
                        {trip.origin} a {trip.destination}
                      </Text>
                      <View style={styles.tripCardFooter}>
                        <Text style={[styles.tripCardCode, active && styles.tripCardCodeActive]}>
                          {trip.code}
                        </Text>
                        <Text style={[styles.tripCardCheckpoint, active && styles.tripCardCheckpointActive]}>
                          {trip.checkpoint}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {loadingSeed ? (
                <View style={styles.inlineRow}>
                  <ActivityIndicator color="#0b6b78" />
                  <Text style={styles.inlineText}>Cargando viajes...</Text>
                </View>
              ) : null}

              {selectedTrip ? (
                <View style={styles.softPanel}>
                  <Text style={styles.softPanelLabel}>Viaje seleccionado</Text>
                  <Text style={styles.softPanelTitle}>{selectedTrip.name}</Text>
                  <Text style={styles.softPanelBody}>
                    Codigo {selectedTrip.code} · {selectedTrip.origin} a {selectedTrip.destination}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.label}>Tu nombre</Text>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={setLoginName}
                placeholder="Ej. Martin Quiroga"
                placeholderTextColor="#8aa0a7"
                style={styles.input}
                value={loginName}
              />

              <Text style={styles.label}>Tu telefono</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                onChangeText={setLoginPhone}
                placeholder="Ej. +54 388 455 1002"
                placeholderTextColor="#8aa0a7"
                style={styles.input}
                value={loginPhone}
              />

              <Text style={styles.helperText}>
                Toca un viaje de la lista y la app usa ese codigo automaticamente.
              </Text>

              {selectedUser ? (
                <View style={styles.softPanel}>
                  <Text style={styles.softPanelLabel}>Ingreso reconocido</Text>
                  <Text style={styles.softPanelTitle}>{selectedUser.name}</Text>
                  <Text style={styles.softPanelBody}>Rol: {selectedUser.role}</Text>
                </View>
              ) : loginName.trim() ? (
                <View style={styles.softPanel}>
                  <Text style={styles.softPanelLabel}>Validacion</Text>
                  <Text style={styles.softPanelTitle}>Nombre nuevo o aun no registrado</Text>
                  <Text style={styles.softPanelBody}>
                    Si no existe todavia, se crea como conductor cuando ingreses.
                  </Text>
                </View>
              ) : null}

              <Pressable
                disabled={submitting}
                onPress={() => void handleLogin()}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting ? "Conectando..." : "Entrar al viaje"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.flexOne}>
                    <Text style={styles.cardEyebrow}>Sesion activa</Text>
                    <Text style={styles.cardTitle}>{session.trip.name}</Text>
                    <Text style={styles.cardBody}>
                      {session.trip.origin} a {session.trip.destination}
                    </Text>
                  </View>
                  <Pressable onPress={handleReset} style={styles.secondaryPill}>
                    <Text style={styles.secondaryPillText}>Salir</Text>
                  </Pressable>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatLabel}>Mi rol</Text>
                    <Text style={styles.miniStatValue}>{roleLabel(session.user.role)}</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatLabel}>Trip code</Text>
                    <Text style={styles.miniStatValue}>{session.trip.code}</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatLabel}>Checkpoint</Text>
                    <Text style={styles.miniStatValue}>{session.trip.checkpoint}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Estado de ubicacion</Text>
                <Text style={styles.cardTitle}>Compartir mi GPS con el coordinador</Text>
                <Text style={styles.cardBody}>
                  La app puede enviar tu posicion manualmente o cada 30 segundos mientras
                  esta pantalla siga abierta. El tracking en segundo plano queda para la
                  siguiente iteracion.
                </Text>

                <View style={styles.softPanel}>
                  <Text style={styles.softPanelLabel}>Estado actual</Text>
                  <Text style={styles.softPanelTitle}>
                    {autoSharing ? "Autoenvio activo" : "Autoenvio pausado"}
                  </Text>
                  <Text style={styles.softPanelBody}>
                    {lastLocationSync
                      ? `Ultima sincronizacion: ${lastLocationSync}`
                      : "Todavia no se envio una ubicacion en esta sesion."}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    disabled={syncingLocation}
                    onPress={() => void handleSendLocation()}
                    style={[styles.primaryButton, styles.flexOne, styles.actionButtonTight]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {syncingLocation ? "Enviando..." : "Enviar mi ubicacion"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setAutoSharing((current) => !current);
                      setFeedback(null);
                    }}
                    style={[styles.secondaryButton, styles.actionButtonTight]}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {autoSharing ? "Pausar auto" : "Activar auto"}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  disabled={refreshing}
                  onPress={() => void refreshDashboard()}
                  style={styles.ghostButton}
                >
                  <Text style={styles.ghostButtonText}>
                    {refreshing ? "Actualizando..." : "Refrescar monitor"}
                  </Text>
                </Pressable>
              </View>

              {dashboard && prioritizedMembers ? (
                <>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>Activos</Text>
                      <Text style={styles.summaryValue}>
                        {dashboard.summary.activeTravelers}
                      </Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>Demorados</Text>
                      <Text style={styles.summaryValue}>
                        {dashboard.summary.delayedTravelers}
                      </Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>Ultima act.</Text>
                      <Text style={styles.summaryValue}>
                        {dashboard.summary.latestUpdateSeconds}s
                      </Text>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardEyebrow}>Vista compartida del viaje</Text>
                    <Text style={styles.cardTitle}>Mapa real para conductor y equipo</Text>
                    <Text style={styles.cardBody}>
                      Esta pantalla ya no depende solo del monitor central: cualquier
                      conductor autenticado puede ver al grupo completo desde su celular.
                    </Text>

                    <View style={styles.mapCard}>
                      <TripGroupMap
                        currentUserId={session.user.id}
                        members={dashboard.members}
                      />
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardEyebrow}>Conductores primero</Text>
                    <Text style={styles.cardTitle}>Seguimiento ordenado por rol</Text>
                    <Text style={styles.cardBody}>
                      La vista prioriza a los conductores del viaje y deja el resto del
                      equipo en un bloque separado para ubicar rapido a cada unidad.
                    </Text>

                    <View style={styles.sectionBlock}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Conductores del viaje</Text>
                        <Text style={styles.sectionBadge}>
                          {prioritizedMembers.drivers.length}
                        </Text>
                      </View>

                      <View style={styles.stack}>
                        {prioritizedMembers.drivers.map((member) => (
                          <View key={member.userId} style={styles.memberCard}>
                            <View style={styles.rowBetween}>
                              <View style={styles.flexOne}>
                                <Text style={styles.memberName}>
                                  {member.userId === session.user.id ? "Vos" : member.name}
                                </Text>
                                <Text style={styles.memberMeta}>
                                  {roleLabel(member.role)} · {member.phone}
                                </Text>
                              </View>
                              <View style={statusChipStyle(member.connectionStatus)}>
                                <Text style={statusTextStyle(member.connectionStatus)}>
                                  {statusLabel(member.connectionStatus)}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.detailRow}>
                              <View style={styles.detailCard}>
                                <Text style={styles.detailLabel}>Precision</Text>
                                <Text style={styles.detailValue}>
                                  {member.latestLocation
                                    ? `${Math.round(member.latestLocation.accuracy)} m`
                                    : "Sin dato"}
                                </Text>
                              </View>
                              <View style={styles.detailCard}>
                                <Text style={styles.detailLabel}>Ubicacion</Text>
                                <Text style={styles.detailValue}>
                                  {member.latestLocation
                                    ? `${member.latestLocation.latitude.toFixed(3)}, ${member.latestLocation.longitude.toFixed(3)}`
                                    : "Sin dato"}
                                </Text>
                              </View>
                              <View style={styles.detailCard}>
                                <Text style={styles.detailLabel}>Bateria</Text>
                                <Text style={styles.detailValue}>
                                  {member.latestLocation
                                    ? `${member.latestLocation.batteryLevel}%`
                                    : "Sin dato"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.sectionBlock}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Coordinacion y resto del grupo</Text>
                        <Text style={styles.sectionBadge}>
                          {prioritizedMembers.others.length}
                        </Text>
                      </View>

                      <View style={styles.stack}>
                        {prioritizedMembers.others.map((member) => (
                          <View key={member.userId} style={styles.memberCard}>
                            <View style={styles.rowBetween}>
                              <View style={styles.flexOne}>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberMeta}>
                                  {roleLabel(member.role)} · {member.phone}
                                </Text>
                              </View>
                              <View style={statusChipStyle(member.connectionStatus)}>
                                <Text style={statusTextStyle(member.connectionStatus)}>
                                  {statusLabel(member.connectionStatus)}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.detailRow}>
                              <View style={styles.detailCard}>
                                <Text style={styles.detailLabel}>Precision</Text>
                                <Text style={styles.detailValue}>
                                  {member.latestLocation
                                    ? `${Math.round(member.latestLocation.accuracy)} m`
                                    : "Sin dato"}
                                </Text>
                              </View>
                              <View style={styles.detailCard}>
                                <Text style={styles.detailLabel}>Ubicacion</Text>
                                <Text style={styles.detailValue}>
                                  {member.latestLocation
                                    ? `${member.latestLocation.latitude.toFixed(3)}, ${member.latestLocation.longitude.toFixed(3)}`
                                    : "Sin dato"}
                                </Text>
                              </View>
                              <View style={styles.detailCard}>
                                <Text style={styles.detailLabel}>Bateria</Text>
                                <Text style={styles.detailValue}>
                                  {member.latestLocation
                                    ? `${member.latestLocation.batteryLevel}%`
                                    : "Sin dato"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardEyebrow}>Bitacora reciente</Text>
                    <View style={styles.stack}>
                      {dashboard.recentEvents.map((event) => (
                        <View key={event} style={styles.eventCard}>
                          <Text style={styles.eventText}>{event}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              ) : null}
            </>
          )}

          {feedback ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{feedback}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4eee7",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  screen: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 24,
  },
  heroCard: {
    backgroundColor: "#0b3a47",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: "#12343f",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 40,
    elevation: 6,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  heroTitle: {
    marginTop: 12,
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },
  heroBody: {
    marginTop: 12,
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 20,
    shadowColor: "#12343f",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 32,
    elevation: 4,
  },
  cardEyebrow: {
    color: "rgba(11,107,120,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  cardTitle: {
    marginTop: 8,
    color: "#12343f",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  cardBody: {
    marginTop: 12,
    color: "#61757d",
    fontSize: 14,
    lineHeight: 22,
  },
  label: {
    marginTop: 18,
    color: "#12343f",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d3dfdf",
    backgroundColor: "#f8fbfb",
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: "#12343f",
    fontSize: 16,
  },
  helperText: {
    marginTop: 12,
    color: "#6b7b82",
    fontSize: 12,
    lineHeight: 18,
  },
  tripGrid: {
    marginTop: 12,
    gap: 12,
  },
  tripCard: {
    borderRadius: 18,
    backgroundColor: "#eef5f5",
    padding: 16,
  },
  tripCardActive: {
    backgroundColor: "#0b6b78",
  },
  tripCardName: {
    color: "#12343f",
    fontSize: 16,
    fontWeight: "700",
  },
  tripCardNameActive: {
    color: "#ffffff",
  },
  tripCardRoute: {
    marginTop: 4,
    color: "#61757d",
    fontSize: 13,
  },
  tripCardRouteActive: {
    color: "rgba(255,255,255,0.8)",
  },
  tripCardFooter: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  tripCardCode: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    color: "#0b6b78",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tripCardCodeActive: {
    backgroundColor: "rgba(255,255,255,0.14)",
    color: "#ffffff",
  },
  tripCardCheckpoint: {
    color: "#61757d",
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  tripCardCheckpointActive: {
    color: "rgba(255,255,255,0.8)",
  },
  inlineRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inlineText: {
    color: "#61757d",
    fontSize: 14,
  },
  softPanel: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "#f4f8f8",
    padding: 16,
  },
  softPanelLabel: {
    color: "#12343f",
    fontSize: 14,
    fontWeight: "600",
  },
  softPanelTitle: {
    marginTop: 4,
    color: "#12343f",
    fontSize: 20,
    fontWeight: "700",
  },
  softPanelBody: {
    marginTop: 2,
    color: "#61757d",
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: "#0b6b78",
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  flexOne: {
    flex: 1,
  },
  secondaryPill: {
    borderRadius: 999,
    backgroundColor: "#edf4f4",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryPillText: {
    color: "#12343f",
    fontSize: 14,
    fontWeight: "700",
  },
  statsRow: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  miniStat: {
    flex: 1,
    minWidth: 90,
    borderRadius: 16,
    backgroundColor: "#f5fbfb",
    padding: 14,
  },
  miniStatLabel: {
    color: "#688087",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  miniStatValue: {
    marginTop: 8,
    color: "#12343f",
    fontSize: 16,
    fontWeight: "700",
  },
  actionRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },
  actionButtonTight: {
    marginTop: 0,
  },
  secondaryButton: {
    borderRadius: 16,
    backgroundColor: "#edf4f4",
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#12343f",
    fontSize: 16,
    fontWeight: "700",
  },
  ghostButton: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d7e4e4",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    color: "#12343f",
    fontSize: 15,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 96,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#12343f",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 32,
    elevation: 4,
  },
  summaryLabel: {
    color: "#688087",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  summaryValue: {
    marginTop: 8,
    color: "#12343f",
    fontSize: 30,
    fontWeight: "700",
  },
  stack: {
    marginTop: 16,
    gap: 14,
  },
  mapCard: {
    marginTop: 18,
  },
  sectionBlock: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: "#12343f",
    fontSize: 18,
    fontWeight: "700",
  },
  sectionBadge: {
    minWidth: 34,
    borderRadius: 999,
    backgroundColor: "#edf4f4",
    color: "#12343f",
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: "center",
  },
  memberCard: {
    borderRadius: 22,
    backgroundColor: "#f6fbfb",
    padding: 16,
  },
  memberName: {
    color: "#12343f",
    fontSize: 18,
    fontWeight: "700",
  },
  memberMeta: {
    marginTop: 4,
    color: "#61757d",
    fontSize: 14,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusOnline: {
    backgroundColor: "#d9f7e8",
  },
  statusDelayed: {
    backgroundColor: "#fff1d8",
  },
  statusOffline: {
    backgroundColor: "#ffe0e0",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusOnlineText: {
    color: "#0f7a46",
  },
  statusDelayedText: {
    color: "#a16000",
  },
  statusOfflineText: {
    color: "#b23a3a",
  },
  detailRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailCard: {
    flex: 1,
    minWidth: 92,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailLabel: {
    color: "#688087",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  detailValue: {
    marginTop: 8,
    color: "#12343f",
    fontSize: 15,
    fontWeight: "700",
  },
  eventCard: {
    borderRadius: 16,
    backgroundColor: "#f6fbfb",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eventText: {
    color: "#12343f",
    fontSize: 14,
    lineHeight: 22,
  },
  successBanner: {
    borderRadius: 16,
    backgroundColor: "#d9f7e8",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  successText: {
    color: "#0f7a46",
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    borderRadius: 16,
    backgroundColor: "#ffe0e0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: "#b23a3a",
    fontSize: 14,
    fontWeight: "600",
  },
});
