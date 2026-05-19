import { MonitorAutoRefresh } from "@/components/monitor-auto-refresh";
import { TravelMonitorPanel } from "@/components/travel-monitor-panel";
import { getSeedCredentials, getTripDashboard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await getTripDashboard("trip_jujuy_001");
  const seed = await getSeedCredentials();

  if (!dashboard) {
    return <main className="p-8">No se encontro el viaje activo.</main>;
  }

  const travelers = dashboard.members.map((member) => {
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
      member.connectionStatus === "online"
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
      lastUpdateLabel: member.latestLocation
        ? new Date(member.latestLocation.recordedAt).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "Sin reportes",
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <MonitorAutoRefresh intervalMs={15000} />

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
                <p className="text-[var(--muted)]">Trip code</p>
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
                `POST /api/auth/session con tripCode ${seed.tripCode} y userId demo.`,
                "GET /api/trips para listar viajes del usuario autenticado.",
                "GET /api/trips/:tripId para obtener dashboard y miembros reales.",
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
    </main>
  );
}
