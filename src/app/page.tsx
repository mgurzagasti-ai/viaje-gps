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
      status,
      location,
      eta:
        member.latestLocation?.speed && member.latestLocation.speed > 0
          ? `${Math.round(member.latestLocation.speed)} km/h`
          : "Detenido",
      battery: `${member.latestLocation?.batteryLevel ?? 0}%`,
      signal,
      accent,
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
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
              Operacion activa · 4 viajeros conectados
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
              Demo UX
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                <span>Ultimo evento</span>
                <span>Hace 12 s</span>
              </div>
              <p className="mt-2 font-medium text-[var(--ink)]">
                Camila recupero precision de GPS y volvio a la ruta principal.
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-strong)] p-4 text-white">
              <p className="text-sm text-white/70">Accion sugerida</p>
              <p className="mt-2 text-lg font-semibold">
                Avisar a Bruno que su bateria quedo por debajo del 50%.
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

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-[rgba(6,39,47,.08)] bg-white/92 p-6 shadow-[0_24px_60px_rgba(31,60,68,.12)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
                Vista del trayecto
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                {dashboard.trip.origin} a {dashboard.trip.destination}
              </h2>
            </div>
            <div className="rounded-full border border-[rgba(6,39,47,.08)] px-4 py-2 text-sm text-[var(--muted)]">
              Siguiente control: {dashboard.trip.checkpoint}
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-[rgba(6,39,47,.08)] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,.22),transparent_38%),linear-gradient(145deg,#0b3540,#0d5666_50%,#0f3b43)] p-5 text-white">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="relative min-h-[320px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-5">
                <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:42px_42px]" />
                <div className="relative z-10 h-full">
                  <div className="mb-4 flex items-center justify-between text-sm text-white/65">
                    <span>Jujuy · Ruta principal</span>
                    <span>GPS + red movil</span>
                  </div>
                  <div className="relative mx-auto mt-5 h-[235px] max-w-[420px]">
                    <div className="absolute left-[14%] top-[12%] h-[68%] w-[60%] rounded-full border border-dashed border-white/25" />
                    <div className="absolute left-[12%] top-[65%] h-20 w-20 rounded-full bg-white/8 blur-2xl" />
                    <div className="absolute left-[22%] top-[18%] h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_0_8px_rgba(52,211,153,.18)]" />
                    <div className="absolute left-[54%] top-[44%] h-3 w-3 rounded-full bg-sky-300 shadow-[0_0_0_8px_rgba(125,211,252,.18)]" />
                    <div className="absolute left-[68%] top-[27%] h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_0_8px_rgba(252,211,77,.18)]" />
                    <div className="absolute left-[79%] top-[61%] h-3 w-3 rounded-full bg-rose-300 shadow-[0_0_0_8px_rgba(253,164,175,.18)]" />
                    <div className="absolute left-[18%] top-[22%] h-[4px] w-[57%] -rotate-[9deg] rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-amber-300 opacity-80" />
                    <div className="absolute left-[57%] top-[42%] h-[4px] w-[27%] rotate-[33deg] rounded-full bg-gradient-to-r from-amber-300 to-rose-300 opacity-75" />
                    <div className="absolute bottom-2 left-0 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/65">
                      Posiciones simuladas para el prototipo
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {travelers.map((traveler) => (
                  <article
                    key={traveler.name}
                    className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4 backdrop-blur"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{traveler.name}</p>
                        <p className="text-sm text-white/65">{traveler.role}</p>
                      </div>
                      <div
                        className={`rounded-full bg-gradient-to-r ${traveler.accent} px-3 py-1 text-xs font-semibold text-slate-950`}
                      >
                        {traveler.status}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
                      <div>
                        <p className="text-white/50">Ubicacion</p>
                        <p className="mt-1 text-white">{traveler.location}</p>
                      </div>
                      <div>
                        <p className="text-white/50">ETA</p>
                        <p className="mt-1 text-white">{traveler.eta}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Bateria</p>
                        <p className="mt-1 text-white">{traveler.battery}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Senal</p>
                        <p className="mt-1 text-white">{traveler.signal}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

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
