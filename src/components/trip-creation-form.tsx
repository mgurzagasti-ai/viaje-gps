"use client";

import { useState } from "react";

type TripCreationFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function TripCreationForm({ action }: TripCreationFormProps) {
  const [alternativeStops, setAlternativeStops] = useState([""]);

  function updateStop(index: number, value: string) {
    setAlternativeStops((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function addStop() {
    setAlternativeStops((current) => [...current, ""]);
  }

  function removeStop(index: number) {
    setAlternativeStops((current) => {
      if (current.length === 1) {
        return [""];
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  return (
    <form action={action} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
        Nombre del viaje
        <input
          name="name"
          required
          className="rounded-2xl border border-[rgba(6,39,47,.12)] bg-[var(--surface-soft)] px-4 py-3 outline-none transition focus:border-[var(--accent-strong)]"
          placeholder="Ej. Viaje Humahuaca Tarde"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
          Codigo del viaje
          <input
            name="code"
            required
            className="rounded-2xl border border-[rgba(6,39,47,.12)] bg-[var(--surface-soft)] px-4 py-3 uppercase outline-none transition focus:border-[var(--accent-strong)]"
            placeholder="Ej. HUMA-2026"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
          Inicio programado
          <input
            name="startsAt"
            type="datetime-local"
            className="rounded-2xl border border-[rgba(6,39,47,.12)] bg-[var(--surface-soft)] px-4 py-3 outline-none transition focus:border-[var(--accent-strong)]"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
          Origen
          <input
            name="origin"
            required
            className="rounded-2xl border border-[rgba(6,39,47,.12)] bg-[var(--surface-soft)] px-4 py-3 outline-none transition focus:border-[var(--accent-strong)]"
            placeholder="Ej. San Salvador de Jujuy"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
          Destino
          <input
            name="destination"
            required
            className="rounded-2xl border border-[rgba(6,39,47,.12)] bg-[var(--surface-soft)] px-4 py-3 outline-none transition focus:border-[var(--accent-strong)]"
            placeholder="Ej. Humahuaca"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
        Checkpoint principal
        <input
          name="checkpoint"
          required
          className="rounded-2xl border border-[rgba(6,39,47,.12)] bg-[var(--surface-soft)] px-4 py-3 outline-none transition focus:border-[var(--accent-strong)]"
          placeholder="Ej. Termas de Reyes"
        />
      </label>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-[var(--ink)]">
            Paradas alternativas
          </label>
          <button
            type="button"
            onClick={addStop}
            className="rounded-full border border-[var(--accent-strong)] px-4 py-2 text-xs font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--accent-strong)] hover:text-white"
          >
            + Agregar parada
          </button>
        </div>

        <input
          type="hidden"
          name="alternativeCheckpoints"
          value={alternativeStops.map((item) => item.trim()).filter(Boolean).join("\n")}
        />

        <div className="grid gap-3">
          {alternativeStops.map((stop, index) => (
            <div
              key={`${index}-${alternativeStops.length}`}
              className="flex items-center gap-3 rounded-2xl border border-[rgba(6,39,47,.08)] bg-[var(--surface-soft)] p-3"
            >
              <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--accent-strong)]">
                {index + 1}
              </span>
              <input
                value={stop}
                onChange={(event) => updateStop(index, event.target.value)}
                className="flex-1 rounded-2xl border border-[rgba(6,39,47,.12)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-strong)]"
                placeholder="Ej. Yala - descanso"
              />
              <button
                type="button"
                onClick={() => removeStop(index)}
                className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs leading-5 text-[var(--muted)]">
          Usa una fila por parada. Puedes cargar puntos de descanso, agrupacion o
          controles intermedios.
        </p>
      </div>

      <button
        type="submit"
        className="mt-2 inline-flex items-center justify-center rounded-2xl bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Guardar viaje
      </button>
    </form>
  );
}
