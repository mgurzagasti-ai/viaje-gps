"use client";

import { useMemo, useState } from "react";
import { TripMap } from "@/components/trip-map";

type TravelerView = {
  name: string;
  role: string;
  connectionStatus: "online" | "delayed" | "offline";
  status: string;
  location: string;
  eta: string;
  battery: string;
  signal: string;
  accent: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  emergencyAlertLabel: string | null;
  lastUpdateLabel: string;
};

type TravelMonitorPanelProps = {
  travelers: TravelerView[];
  origin: string;
  destination: string;
  checkpoint: string;
  alternativeCheckpoints: string[];
  activeEmergencyAlerts: Array<{
    id: string;
    userName: string;
    userPhone: string;
    type: "accident" | "sos";
    message: string;
    updatedAt: string;
  }>;
};

export function TravelMonitorPanel({
  travelers,
  origin,
  destination,
  checkpoint,
  alternativeCheckpoints,
  activeEmergencyAlerts,
}: TravelMonitorPanelProps) {
  const [viewMode, setViewMode] = useState<"group" | "individual">("group");
  const [selectedTravelerName, setSelectedTravelerName] = useState(
    travelers[0]?.name ?? "",
  );

  const selectedTraveler = useMemo(
    () => travelers.find((traveler) => traveler.name === selectedTravelerName) ?? travelers[0],
    [selectedTravelerName, travelers],
  );

  const mapTravelers =
    viewMode === "group" ? travelers : selectedTraveler ? [selectedTraveler] : [];

  return (
    <section className="grid gap-6">
      {activeEmergencyAlerts.length > 0 ? (
        <section className="rounded-[2rem] border border-rose-200 bg-[linear-gradient(135deg,#fff4f2,#ffe8e3)] p-6 shadow-[0_18px_50px_rgba(161,47,25,.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">
            Emergencia activa
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {activeEmergencyAlerts.map((alert) => (
              <article
                key={alert.id}
                className="rounded-[1.35rem] border border-rose-200 bg-white/85 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-rose-800">
                      {alert.type === "accident" ? "Accidente" : "911"} · {alert.userName}
                    </p>
                    <p className="text-sm text-rose-700">{alert.userPhone}</p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                    Ayuda
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--ink)]">{alert.message}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="rounded-[2rem] border border-[rgba(6,39,47,.08)] bg-white/92 p-6 shadow-[0_24px_60px_rgba(31,60,68,.12)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
              Vista del trayecto
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
              {origin} a {destination}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-[rgba(6,39,47,.08)] px-4 py-2 text-sm text-[var(--muted)]">
              Siguiente control: {checkpoint}
            </div>
            {alternativeCheckpoints.length > 0 ? (
              <div className="rounded-[1.25rem] border border-[rgba(6,39,47,.08)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--ink)]">
                <p className="font-semibold text-[var(--accent-strong)]">
                  Paradas operativas
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {alternativeCheckpoints.map((stop) => (
                    <span
                      key={stop}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink)]"
                    >
                      {stop}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="inline-flex rounded-full border border-[rgba(6,39,47,.08)] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("group")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  viewMode === "group"
                    ? "bg-[var(--accent-strong)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                Recorrido grupal
              </button>
              <button
                type="button"
                onClick={() => setViewMode("individual")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  viewMode === "individual"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                Recorrido individual
              </button>
            </div>
          </div>
        </div>

        {viewMode === "individual" ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {travelers.map((traveler) => (
              <button
                key={traveler.name}
                type="button"
                onClick={() => setSelectedTravelerName(traveler.name)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  traveler.name === selectedTraveler?.name
                    ? "border-transparent bg-[var(--ink)] text-white shadow-[0_10px_24px_rgba(20,48,59,.2)]"
                    : "border-[rgba(6,39,47,.12)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {traveler.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6 rounded-[1.75rem] border border-[rgba(6,39,47,.08)] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,.22),transparent_38%),linear-gradient(145deg,#0b3540,#0d5666_50%,#0f3b43)] p-5 text-white">
          <div className="mb-4 flex items-center justify-between text-sm text-white/65">
            <span>
              {viewMode === "group"
                ? "Jujuy · Ruta principal"
                : `${selectedTraveler?.name ?? "Viajero"} · Seguimiento puntual`}
            </span>
            <span>
              {viewMode === "group" ? "GPS + red movil" : "GPS individual + ultimo reporte"}
            </span>
          </div>
          <TripMap
            travelers={mapTravelers.map((traveler) => ({
              name: traveler.name,
              role: traveler.role,
              status: traveler.connectionStatus,
              latitude: traveler.latitude,
              longitude: traveler.longitude,
              accuracy: traveler.accuracy,
              batteryLabel: traveler.battery,
              signalLabel: traveler.signal,
              lastUpdateLabel: traveler.lastUpdateLabel,
            }))}
            routeLabel={
              viewMode === "group" ? "Jujuy · Ruta principal" : "Seguimiento individual"
            }
            networkLabel={viewMode === "group" ? "GPS + red movil" : "Foco en un viajero"}
            heightClassName="h-[420px] md:h-[480px]"
          />
        </div>
      </div>

      <section className="rounded-[2rem] border border-[rgba(6,39,47,.08)] bg-[linear-gradient(145deg,#0b3540,#0d5666_50%,#0f3b43)] p-6 text-white shadow-[0_24px_60px_rgba(31,60,68,.12)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/65">
              {viewMode === "group" ? "Viajeros del grupo" : "Ficha del viajero"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {viewMode === "group"
                ? "Estado actual del convoy"
                : `Seguimiento dedicado de ${selectedTraveler?.name ?? "un viajero"}`}
            </h2>
          </div>
          <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/80">
            {viewMode === "group"
              ? `${travelers.filter((traveler) => traveler.connectionStatus === "online").length} activos ahora`
              : selectedTraveler?.status ?? "Sin datos"}
          </span>
        </div>

        {viewMode === "group" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
                {traveler.emergencyAlertLabel ? (
                  <div className="mt-3 rounded-2xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">
                    {traveler.emergencyAlertLabel}
                  </div>
                ) : null}
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
        ) : selectedTraveler ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold">{selectedTraveler.name}</p>
                  <p className="mt-1 text-sm text-white/65">{selectedTraveler.role}</p>
                </div>
                <div
                  className={`rounded-full bg-gradient-to-r ${selectedTraveler.accent} px-3 py-1 text-xs font-semibold text-slate-950`}
                >
                  {selectedTraveler.status}
                </div>
              </div>
              <div className="mt-5 space-y-4 text-sm text-white/75">
                {selectedTraveler.emergencyAlertLabel ? (
                  <div className="rounded-2xl bg-rose-100 px-4 py-3 text-rose-700">
                    <p className="font-semibold">{selectedTraveler.emergencyAlertLabel}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-white/50">Ultimo reporte</p>
                  <p className="mt-1 text-white">{selectedTraveler.lastUpdateLabel}</p>
                </div>
                <div>
                  <p className="text-white/50">Ubicacion</p>
                  <p className="mt-1 text-white">{selectedTraveler.location}</p>
                </div>
                <div>
                  <p className="text-white/50">Velocidad / ETA</p>
                  <p className="mt-1 text-white">{selectedTraveler.eta}</p>
                </div>
              </div>
            </article>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-sm text-white/55">Bateria</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {selectedTraveler.battery}
                </p>
              </article>
              <article className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-sm text-white/55">Senal</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {selectedTraveler.signal}
                </p>
              </article>
              <article className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-sm text-white/55">Modo</p>
                <p className="mt-3 text-3xl font-semibold text-white">Individual</p>
              </article>
              <article className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4 backdrop-blur md:col-span-3">
                <p className="text-sm text-white/55">Lectura operativa</p>
                <p className="mt-3 text-base leading-7 text-white/85">
                  Este modo te deja seguir a una sola persona sin mezclar su marcador con
                  el resto del convoy. Ideal para cuando alguien se separa del grupo o
                  necesitas confirmar una parada puntual.
                </p>
              </article>
            </div>
          </div>
        ) : null}
      </section>
    </section>
  );
}
