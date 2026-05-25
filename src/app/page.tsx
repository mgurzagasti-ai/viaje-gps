import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MonitorAutoRefresh } from "@/components/monitor-auto-refresh";
import { TripCreationForm } from "@/components/trip-creation-form";
import { TravelMonitorPanel } from "@/components/travel-monitor-panel";
import {
  authenticateMonitor,
  clearMonitorSession,
  createMonitorSession,
  getMonitorConfigStatus,
  isMonitorAuthenticated,
  requireMonitorAuthentication,
} from "@/lib/monitor-auth";
import {
  createTrip,
  deleteTrip,
  getAllTrips,
  getTripDashboard,
  resolveEmergencyAlert,
} from "@/lib/store";

export const dynamic = "force-dynamic";

async function createTripAction(formData: FormData) {
  "use server";

  await requireMonitorAuthentication();

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const origin = String(formData.get("origin") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const checkpoint = String(formData.get("checkpoint") ?? "").trim();
  const alternativeCheckpoints = String(formData.get("alternativeCheckpoints") ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  const startsAt = String(formData.get("startsAt") ?? "").trim();

  if (!name || !code || !origin || !destination || !checkpoint) {
    redirect("/?error=missing-trip-fields");
  }

  const result = await createTrip({
    name,
    code,
    origin,
    destination,
    checkpoint,
    alternativeCheckpoints,
    startsAt,
  });

  if ("error" in result) {
    redirect(`/?error=${result.error}`);
  }

  revalidatePath("/");
  redirect(`/?tripId=${result.trip.id}`);
}

async function deleteTripAction(formData: FormData) {
  "use server";

  await requireMonitorAuthentication();

  const tripId = String(formData.get("tripId") ?? "").trim();

  if (!tripId) {
    redirect("/?error=trip-not-found");
  }

  const trips = await getAllTrips();
  const remainingTrips = trips.filter((trip) => trip.id !== tripId);
  const result = await deleteTrip(tripId);

  if ("error" in result) {
    redirect("/?error=trip-not-found");
  }

  revalidatePath("/");

  if (remainingTrips[0]) {
    redirect(`/?tripId=${remainingTrips[0].id}`);
  }

  redirect("/");
}

async function resolveEmergencyAlertAction(formData: FormData) {
  "use server";

  await requireMonitorAuthentication();

  const alertId = String(formData.get("alertId") ?? "").trim();

  if (!alertId) {
    return;
  }

  await resolveEmergencyAlert(alertId);
  revalidatePath("/");
}

async function loginAction(formData: FormData) {
  "use server";

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!(await authenticateMonitor(username, password))) {
    redirect("/?error=invalid-login");
  }

  await createMonitorSession();
  redirect("/");
}

async function logoutAction() {
  "use server";

  await clearMonitorSession();
  redirect("/");
}

type HomeProps = {
  searchParams?: Promise<{
    tripId?: string;
    error?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : undefined;
  const monitorConfig = getMonitorConfigStatus();
  const isAuthorized = await isMonitorAuthenticated();

  if (!isAuthorized) {
    const loginError =
      !monitorConfig.isConfigured && process.env.NODE_ENV === "production"
        ? "Faltan variables del monitor en el servidor. Configura MONITOR_USERNAME, MONITOR_PASSWORD y MONITOR_SESSION_SECRET."
        : params?.error === "invalid-login"
        ? "Usuario o contrasena incorrectos."
        : params?.error === "unauthorized"
          ? "Necesitas iniciar sesion para entrar al monitor."
          : null;

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="hero-shimmer relative mx-auto grid w-full max-w-5xl gap-8 overflow-hidden rounded-[2.5rem] border border-white/40 bg-[linear-gradient(135deg,rgba(7,42,51,.97),rgba(10,86,104,.93),rgba(227,123,67,.9))] p-6 text-white shadow-[0_32px_90px_rgba(7,42,51,.28)] lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,.12),transparent_22%)]" />

          <div className="relative flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-white/70">
              Acceso protegido
            </p>
            <h1 className="hero-neon-title hero-title-float mt-4 text-4xl font-black sm:text-5xl">
              <span className="text-white">Monitor</span>
              <span className="mx-2 text-white/55">-</span>
              <span className="hero-neon-gps bg-[linear-gradient(135deg,#fff6dd,#ffffff,#ffd1b5)] bg-clip-text text-transparent">
                Viaje GPS
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
              El panel de seguimiento solo se muestra a usuarios autorizados. Inicia
              sesion para ver viajes, ubicaciones y alertas activas.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-white/78 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                Monitoreo en vivo del convoy
              </div>
              <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                Acciones protegidas del lado servidor
              </div>
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-white/20 bg-white/12 p-6 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-white/65">
              Iniciar sesion
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Credenciales del monitor</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              El acceso se valida en el servidor y la sesion queda guardada en una
              cookie segura.
            </p>

            {loginError ? (
              <div className="mt-5 rounded-2xl border border-rose-300/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
                {loginError}
              </div>
            ) : null}

            <form action={loginAction} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-white/78">Usuario</span>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  className="rounded-2xl border border-white/15 bg-white/92 px-4 py-3 text-[var(--ink)] outline-none transition placeholder:text-slate-400 focus:border-white/40 focus:bg-white"
                  placeholder="Ingresar usuario"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-white/78">Contrasena</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  className="rounded-2xl border border-white/15 bg-white/92 px-4 py-3 text-[var(--ink)] outline-none transition placeholder:text-slate-400 focus:border-white/40 focus:bg-white"
                  placeholder="Ingresar contrasena"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={!monitorConfig.isConfigured && process.env.NODE_ENV === "production"}
                className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[#fff5ee]"
              >
                Entrar al monitor
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  const trips = await getAllTrips();
  const selectedTripId = params?.tripId ?? trips[0]?.id ?? null;
  const dashboard = selectedTripId ? await getTripDashboard(selectedTripId) : null;
  const errorMessage =
    params?.error === "duplicate-code"
      ? "Ya existe un viaje con ese codigo."
        : params?.error === "missing-trip-fields"
        ? "Completa todos los campos del viaje antes de guardarlo."
        : params?.error === "missing-code"
          ? "El codigo del viaje es obligatorio."
          : params?.error === "trip-not-found"
            ? "No se encontro el viaje que querias borrar."
          : null;

  const travelers =
    dashboard?.members.map((member) => {
      const status =
        member.connectionStatus === "online"
          ? "Compartiendo GPS"
          : member.connectionStatus === "delayed"
            ? "Actualizacion demorada"
            : "Sin conexion";

      const location = member.latestLocation
        ? `${member.latestLocation.latitude.toFixed(4)}, ${member.latestLocation.longitude.toFixed(4)}`
        : "Sin ubicacion";

      const signal =
        member.latestLocation?.signalStrength === "high"
          ? "Alta"
          : member.latestLocation?.signalStrength === "medium"
            ? "Media"
            : "Baja";

      const accent =
        member.emergencyAlert
          ? "from-rose-300 to-red-500"
          : member.connectionStatus === "online"
          ? "from-emerald-400 to-teal-500"
          : member.connectionStatus === "delayed"
            ? "from-amber-300 to-orange-500"
            : "from-rose-300 to-fuchsia-500";

      return {
        name: member.name,
        role: member.role,
        connectionStatus: member.connectionStatus,
        status,
        location,
        eta:
          member.latestLocation?.speed && member.latestLocation.speed > 0
            ? `${Math.round(member.latestLocation.speed)} km/h`
            : "Detenido",
        battery: `${member.latestLocation?.batteryLevel ?? 0}%`,
        signal,
        accent,
        latitude: member.latestLocation?.latitude ?? null,
        longitude: member.latestLocation?.longitude ?? null,
        accuracy: member.latestLocation?.accuracy ?? null,
        emergencyAlertLabel: member.emergencyAlert
          ? member.emergencyAlert.type === "accident"
            ? "Accidente reportado"
            : "Pedido 911 activo"
          : null,
        lastUpdateLabel: member.latestLocation
          ? new Date(member.latestLocation.recordedAt).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "Sin reportes",
      };
    }) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <MonitorAutoRefresh intervalMs={15000} />

      <section className="hero-shimmer relative overflow-hidden rounded-[2rem] border border-white/40 bg-[linear-gradient(135deg,rgba(7,42,51,.96),rgba(10,86,104,.92),rgba(227,123,67,.88))] px-6 py-6 text-white shadow-[0_28px_80px_rgba(7,42,51,.24)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,.12),transparent_24%)]" />
        <div className="relative flex flex-col items-center gap-5 text-center">
          <div className="hero-card-fade-up flex flex-col items-center">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-white/70">
              Plataforma de monitoreo
            </p>
            <h1 className="hero-neon-title hero-title-float mt-3 text-4xl font-black sm:text-5xl">
              <span className="text-white">Viaje</span>
              <span className="mx-2 text-white/55">-</span>
              <span className="hero-neon-gps bg-[linear-gradient(135deg,#fff6dd,#ffffff,#ffd1b5)] bg-clip-text text-transparent">
                GPS
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
              Seguimiento visual del convoy, alertas activas y control operativo desde
              una sola pantalla.
            </p>
          </div>
          <div className="grid gap-2 rounded-[1.5rem] border border-white/15 bg-white/10 px-4 py-4 text-center text-sm backdrop-blur">
            <span className="text-white/65">Estado del panel</span>
            <span className="text-lg font-semibold text-white">
              {dashboard ? "Monitoreo en vivo" : "Listo para cargar un viaje"}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Cerrar sesion
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-[rgba(6,39,47,.08)] bg-white/92 p-6 shadow-[0_24px_60px_rgba(31,60,68,.12)]">
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
            Administracion
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
            Crear viaje y codigo
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Desde aca cargas un viaje nuevo con su codigo para que despues los
            conductores entren desde el telefono.
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <TripCreationForm action={createTripAction} />
        </section>

        <section className="rounded-[2rem] border border-[rgba(6,39,47,.08)] bg-white/92 p-6 shadow-[0_24px_60px_rgba(31,60,68,.12)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
                Viajes cargados
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                Elegir viaje para monitorear
              </h2>
            </div>
            <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              {trips.length} viajes
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            {trips.length > 0 ? (
              trips.map((trip) => {
                const active = trip.id === selectedTripId;

                return (
                  <div
                    key={trip.id}
                    className={`rounded-[1.6rem] border px-5 py-4 transition ${
                      active
                        ? "border-transparent bg-[var(--surface-strong)] text-white shadow-[0_20px_40px_rgba(13,86,102,.22)]"
                        : "border-[rgba(6,39,47,.08)] bg-[var(--surface-soft)] text-[var(--ink)] hover:border-[var(--accent-strong)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <Link href={`/?tripId=${trip.id}`} className="min-w-0 flex-1">
                        <div>
                          <p className="text-lg font-semibold">{trip.name}</p>
                          <p className={active ? "text-white/70" : "text-[var(--muted)]"}>
                            {trip.origin} a {trip.destination}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            active
                              ? "bg-white/12 text-white"
                              : "bg-white text-[var(--accent-strong)]"
                          }`}
                        >
                          {trip.code}
                        </span>
                        <form action={deleteTripAction}>
                          <input type="hidden" name="tripId" value={trip.id} />
                          <button
                            type="submit"
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              active
                                ? "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                                : "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                            }`}
                          >
                            Borrar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-[var(--surface-soft)] px-4 py-5 text-sm text-[var(--muted)]">
                Aun no hay viajes cargados. Crea el primero desde el formulario.
              </div>
            )}
          </div>
        </section>
      </section>

      {!dashboard ? (
        <section className="rounded-[2rem] border border-[rgba(6,39,47,.08)] bg-white/92 p-8 text-[var(--muted)] shadow-[0_24px_60px_rgba(31,60,68,.12)]">
          No se encontro el viaje seleccionado.
        </section>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,rgba(7,42,51,.95),rgba(8,88,109,.88),rgba(232,140,67,.9))] p-8 text-white shadow-[0_30px_80px_rgba(7,42,51,.35)]">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-white/70">
                    Monitor del viaje
                  </p>
                  <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                    Ubicacion en tiempo real para cada integrante del recorrido.
                  </h1>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                  Operacion activa · {dashboard.members.length} viajeros monitoreados
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <article className="rounded-3xl border border-white/15 bg-black/15 p-5 backdrop-blur">
                  <p className="text-sm text-white/70">Actualizacion media</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {dashboard.summary.latestUpdateSeconds} s
                  </p>
                  <p className="mt-2 text-sm text-white/75">
                    Intervalo recomendado para ahorrar bateria sin perder visibilidad.
                  </p>
                </article>
                <article className="rounded-3xl border border-white/15 bg-black/15 p-5 backdrop-blur">
                  <p className="text-sm text-white/70">Cobertura del grupo</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {dashboard.summary.activeTravelers}/{dashboard.members.length}
                  </p>
                  <p className="mt-2 text-sm text-white/75">
                    {dashboard.summary.delayedTravelers} equipos con reconexion reciente o demora.
                  </p>
                </article>
                <article className="rounded-3xl border border-white/15 bg-black/15 p-5 backdrop-blur">
                  <p className="text-sm text-white/70">Bateria promedio</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {dashboard.summary.averageBattery}%
                  </p>
                  <p className="mt-2 text-sm text-white/75">
                    Referencia inicial para futuras alertas de ahorro de energia.
                  </p>
                </article>
                <article className="rounded-3xl border border-white/15 bg-[rgba(123,22,22,.42)] p-5 backdrop-blur">
                  <p className="text-sm text-white/70">Alertas de ayuda</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {dashboard.summary.activeEmergencyAlerts}
                  </p>
                  <p className="mt-2 text-sm text-white/75">
                    Avisos de accidente o 911 activos en la flota.
                  </p>
                </article>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-[rgba(6,39,47,.08)] bg-[rgba(250,246,240,.88)] p-6 shadow-[0_24px_60px_rgba(31,60,68,.12)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
                    Estado general
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                    Panel rapido
                  </h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                  Auto refresh 15 s
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-white p-4">
                  <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                    <span>Ultimo evento</span>
                    <span>Hace {dashboard.summary.latestUpdateSeconds} s</span>
                  </div>
                  <p className="mt-2 font-medium text-[var(--ink)]">
                    {dashboard.recentEvents[0] ?? "Esperando el siguiente reporte del grupo."}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--surface-strong)] p-4 text-white">
                  <p className="text-sm text-white/70">Accion sugerida</p>
                  <p className="mt-2 text-lg font-semibold">
                    {dashboard.summary.averageBattery < 55
                      ? "Conviene pedir carga de bateria al equipo de apoyo."
                      : "La flota viene estable; siguiente foco: confirmar el proximo control."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-[rgba(6,39,47,.08)] bg-white p-4">
                    <p className="text-[var(--muted)]">Viajeros</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                      {dashboard.members.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[rgba(6,39,47,.08)] bg-white p-4">
                    <p className="text-[var(--muted)]">Codigo interno</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                      {dashboard.trip.code}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <TravelMonitorPanel
            travelers={travelers}
            origin={dashboard.trip.origin}
            destination={dashboard.trip.destination}
            checkpoint={dashboard.trip.checkpoint}
            alternativeCheckpoints={dashboard.trip.alternativeCheckpoints}
            activeEmergencyAlerts={dashboard.activeEmergencyAlerts}
            resolveEmergencyAlertAction={resolveEmergencyAlertAction}
          />

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div />

            <div className="grid gap-6">
              <section className="rounded-[2rem] border border-[rgba(6,39,47,.08)] bg-white/92 p-6 shadow-[0_24px_60px_rgba(31,60,68,.12)]">
                <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
                  App cliente
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  API y cliente movil
                </h2>
                <div className="mt-5 space-y-3">
                  {[
                    "POST /api/auth/session con tripCode entregado por el monitor y login real por nombre.",
                    "GET /api/trips para listar solo los viajes del usuario autenticado.",
                    "GET /api/trips/:tripId para obtener dashboard sin exponer el codigo del viaje.",
                    "POST /api/trips/:tripId/locations para enviar GPS desde la app Expo.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl bg-[var(--surface-soft)] p-4"
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
                        +
                      </span>
                      <p className="text-sm leading-6 text-[var(--ink)]">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-[rgba(6,39,47,.08)] bg-white/92 p-6 shadow-[0_24px_60px_rgba(31,60,68,.12)]">
                <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
                  Bitacora en vivo
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Eventos del recorrido
                </h2>
                <div className="mt-5 space-y-4">
                  {dashboard.recentEvents.map((event) => (
                    <div key={event} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-[var(--accent-strong)]" />
                        <div className="mt-2 h-full w-px bg-[rgba(6,39,47,.1)]" />
                      </div>
                      <p className="pb-4 text-sm leading-6 text-[var(--ink)]">{event}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
