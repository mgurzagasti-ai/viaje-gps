"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MapTraveler = {
  name: string;
  role: string;
  status: "online" | "delayed" | "offline";
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  batteryLabel: string;
  signalLabel: string;
  lastUpdateLabel: string;
};

type TripMapProps = {
  travelers: MapTraveler[];
  routeLabel: string;
  networkLabel: string;
  heightClassName?: string;
};

declare global {
  interface Window {
    L?: {
      circle: (...args: unknown[]) => {
        addTo: (map: unknown) => void;
      };
      divIcon: (...args: unknown[]) => unknown;
      latLngBounds: (coords: [number, number][]) => {
        pad: (padding: number) => unknown;
      };
      map: (
        element: HTMLElement,
        options?: Record<string, unknown>,
      ) => {
        fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void;
        remove: () => void;
        setView: (center: [number, number], zoom: number) => void;
      };
      marker: (coords: [number, number], options?: Record<string, unknown>) => {
        addTo: (map: unknown) => {
          bindPopup: (content: string) => void;
        };
      };
      polyline: (
        coords: [number, number][],
        options?: Record<string, unknown>,
      ) => {
        addTo: (map: unknown) => void;
      };
      tileLayer: (url: string, options?: Record<string, unknown>) => {
        addTo: (map: unknown) => void;
      };
    };
  }
}

const fallbackCenter: [number, number] = [-24.1858, -65.2995];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadLeafletAssets(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const cssId = "leaflet-cdn-styles";
  if (!document.getElementById(cssId)) {
    const link = document.createElement("link");
    link.id = cssId;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.crossOrigin = "";
    document.head.appendChild(link);
  }

  if (window.L) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const scriptId = "leaflet-cdn-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Leaflet failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.crossOrigin = "";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet failed"));
    document.body.appendChild(script);
  });
}

export function TripMap({
  travelers,
  routeLabel,
  networkLabel,
  heightClassName = "h-[320px]",
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);

  const locatedTravelers = useMemo(
    () =>
      travelers.filter(
        (traveler): traveler is MapTraveler & { latitude: number; longitude: number } =>
          typeof traveler.latitude === "number" && typeof traveler.longitude === "number",
      ),
    [travelers],
  );

  useEffect(() => {
    let cancelled = false;
    let mapInstance: { remove: () => void } | null = null;

    async function bootstrapMap() {
      try {
        await loadLeafletAssets();

        if (cancelled || !mapRef.current || !window.L) {
          return;
        }

        const L = window.L;
        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: true,
        });
        mapInstance = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        const points: [number, number][] = [];

        locatedTravelers.forEach((traveler) => {
          const coords: [number, number] = [traveler.latitude, traveler.longitude];
          points.push(coords);

          const marker = L.marker(coords, {
            icon: L.divIcon({
              className: "gps-map-marker-shell",
              html: `
                <div class="gps-map-pin">
                  <span class="gps-map-marker gps-map-marker--${traveler.status}"></span>
                  <span class="gps-map-chip gps-map-chip--${traveler.status}">
                    ${escapeHtml(traveler.name)}
                  </span>
                </div>
              `,
              iconSize: [132, 34],
              iconAnchor: [18, 18],
            }),
          }).addTo(map);

          marker.bindPopup(`
            <div class="gps-popup">
              <strong>${escapeHtml(traveler.name)}</strong>
              <span>${escapeHtml(traveler.role)}</span>
              <span>Estado: ${escapeHtml(traveler.status)}</span>
              <span>Bateria: ${escapeHtml(traveler.batteryLabel)}</span>
              <span>Senal: ${escapeHtml(traveler.signalLabel)}</span>
              <span>Ultimo reporte: ${escapeHtml(traveler.lastUpdateLabel)}</span>
            </div>
          `);

          if (traveler.accuracy && traveler.accuracy > 0) {
            L.circle(coords, {
              radius: Math.max(traveler.accuracy, 4),
              color: traveler.status === "online" ? "#4ade80" : "#f59e0b",
              fillColor: traveler.status === "online" ? "#34d399" : "#fbbf24",
              fillOpacity: 0.12,
              weight: 1,
            }).addTo(map);
          }
        });

        if (points.length > 1) {
          L.polyline(points, {
            color: "#60a5fa",
            weight: 4,
            opacity: 0.68,
            dashArray: "10 8",
          }).addTo(map);
          map.fitBounds(L.latLngBounds(points).pad(0.28), {
            padding: [24, 24],
          });
        } else if (points.length === 1) {
          map.setView(points[0], 12);
        } else {
          map.setView(fallbackCenter, 10);
        }

        setAssetError(null);
      } catch {
        if (!cancelled) {
          setAssetError("No se pudo cargar el mapa base en este navegador.");
        }
      }
    }

    void bootstrapMap();

    return () => {
      cancelled = true;
      mapInstance?.remove();
    };
  }, [locatedTravelers]);

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b3540]">
      <div
        ref={mapRef}
        className={`gps-map-canvas w-full ${heightClassName}`}
        aria-label="Mapa en tiempo real del viaje"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between gap-3 p-4 text-sm text-white/80">
        <span className="rounded-full border border-white/12 bg-black/25 px-3 py-1 backdrop-blur">
          {routeLabel}
        </span>
        <span className="rounded-full border border-white/12 bg-black/25 px-3 py-1 backdrop-blur">
          {networkLabel}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] flex flex-wrap items-center gap-2 p-4 text-xs text-white/75">
        <span className="rounded-full border border-white/12 bg-black/30 px-3 py-2 uppercase tracking-[0.28em]">
          OpenStreetMap en vivo
        </span>
        <span className="rounded-full border border-white/12 bg-black/20 px-3 py-2">
          {locatedTravelers.length} viajeros con coordenadas
        </span>
      </div>

      {assetError ? (
        <div className="absolute inset-4 z-[520] flex items-end">
          <div className="rounded-2xl border border-amber-300/30 bg-amber-100/92 px-4 py-3 text-sm text-amber-950 shadow-lg">
            {assetError}
          </div>
        </div>
      ) : null}
    </div>
  );
}
