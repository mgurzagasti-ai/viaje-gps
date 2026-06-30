import { Fragment, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
import { WebView } from "react-native-webview";
import { DashboardResponse } from "./types";

type TripGroupMapProps = {
  currentUserId: string;
  members: DashboardResponse["members"];
  variant?: "card" | "full";
};

type LocatedMember = DashboardResponse["members"][number] & {
  latestLocation: NonNullable<DashboardResponse["members"][number]["latestLocation"]>;
};

function compareNames(left: string, right: string) {
  return left
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .localeCompare(
      right
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    );
}

function statusColor(status: DashboardResponse["members"][number]["connectionStatus"]) {
  if (status === "online") {
    return "#1f9d67";
  }

  if (status === "delayed") {
    return "#d58a18";
  }

  return "#cf5b5b";
}

function markerTitle(member: DashboardResponse["members"][number], currentUserId: string) {
  return member.userId === currentUserId ? "Vos" : member.name;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildAndroidMapHtml(
  members: Array<{
    name: string;
    role: string;
    connectionStatus: DashboardResponse["members"][number]["connectionStatus"];
    latitude: number;
    longitude: number;
    accuracy: number;
    batteryLevel: number;
    isCurrentUser: boolean;
  }>,
) {
  const serializedMembers = JSON.stringify(members);

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      crossorigin=""
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #dce8e8;
        font-family: Arial, sans-serif;
      }

      .leaflet-container {
        background: #dce8e8;
      }

      .leaflet-control-attribution {
        font-size: 10px;
      }

      .popup {
        display: grid;
        gap: 4px;
        min-width: 140px;
      }

      .popup strong {
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const members = ${serializedMembers};
      const fallbackCenter = [-24.1858, -65.2995];

      function colorForStatus(status) {
        if (status === "online") return "#1f9d67";
        if (status === "delayed") return "#d58a18";
        return "#cf5b5b";
      }

      function markerRadius(member) {
        return member.isCurrentUser ? 10 : 8;
      }

      const map = L.map("map", {
        zoomControl: false,
        attributionControl: true,
      }).setView(fallbackCenter, 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const points = [];

      members.forEach((member) => {
        const coords = [member.latitude, member.longitude];
        points.push(coords);

        const color = colorForStatus(member.connectionStatus);

        L.circle(coords, {
          radius: Math.max(member.accuracy, 6),
          color: color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.12,
        }).addTo(map);
        const marker = L.circleMarker(coords, {
          radius: markerRadius(member),
          color: "#ffffff",
          weight: 2,
          fillColor: member.isCurrentUser ? "#e48649" : color,
          fillOpacity: 1,
        }).addTo(map);

        marker.bindPopup(
          '<div class="popup">' +
            "<strong>" + member.name + "</strong>" +
            "<span>" + member.role + "</span>" +
            "<span>Estado: " + member.connectionStatus + "</span>" +
            "<span>Bateria: " + member.batteryLevel + "%</span>" +
            "</div>"
        );
      });

      if (points.length > 1) {
        L.polyline(points, {
          color: "#0b6b78",
          weight: 4,
          opacity: 0.85,
        }).addTo(map);

        map.fitBounds(points, { padding: [28, 28] });
      } else if (points.length === 1) {
        map.setView(points[0], 12);
      }
    </script>
  </body>
</html>`;
}

export function TripGroupMap({
  currentUserId,
  members,
  variant = "card",
}: TripGroupMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const locatedMembers = useMemo(
    () =>
      members.filter(
        (member): member is LocatedMember => Boolean(member.latestLocation),
      ),
    [members],
  );

  const sortedMembers = useMemo(
    () =>
      [...locatedMembers].sort((left, right) => {
        if (left.role === "driver" && right.role !== "driver") {
          return -1;
        }

        if (left.role !== "driver" && right.role === "driver") {
          return 1;
        }

        return compareNames(left.name, right.name);
      }),
    [locatedMembers],
  );

  const fallbackRegion = {
    latitude: -24.1858,
    longitude: -65.2995,
    latitudeDelta: 0.18,
    longitudeDelta: 0.18,
  };

  const initialRegion = sortedMembers[0]
    ? {
        latitude: sortedMembers[0].latestLocation.latitude,
        longitude: sortedMembers[0].latestLocation.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : fallbackRegion;

  useEffect(() => {
    if (!mapRef.current || sortedMembers.length === 0) {
      return;
    }

    const coordinates = sortedMembers.map((member) => ({
      latitude: member.latestLocation.latitude,
      longitude: member.latestLocation.longitude,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 72,
        right: 72,
        bottom: 72,
        left: 72,
      },
      animated: true,
    });
  }, [sortedMembers]);

  if (sortedMembers.length === 0) {
    return (
      <View style={[styles.emptyState, variant === "full" ? styles.emptyStateFull : null]}>
        <Text style={styles.emptyTitle}>Todavia no hay ubicaciones para mostrar</Text>
        <Text style={styles.emptyBody}>
          Cuando el grupo empiece a compartir GPS, aca vas a ver el mapa real del
          recorrido.
        </Text>
      </View>
    );
  }

  const driverCount = sortedMembers.filter((member) => member.role === "driver").length;

  if (Platform.OS === "android") {
    const androidMapHtml = buildAndroidMapHtml(
      sortedMembers.map((member) => ({
        name: escapeHtml(markerTitle(member, currentUserId)),
        role: escapeHtml(member.role),
        connectionStatus: member.connectionStatus,
        latitude: member.latestLocation.latitude,
        longitude: member.latestLocation.longitude,
        accuracy: member.latestLocation.accuracy,
        batteryLevel: member.latestLocation.batteryLevel,
        isCurrentUser: member.userId === currentUserId,
      })),
    );

    return (
      <View style={[styles.wrapper, variant === "full" ? styles.wrapperFull : null]}>
        <View style={[styles.mapFrame, variant === "full" ? styles.mapFrameFull : null]}>
          <WebView
            androidLayerType="hardware"
            domStorageEnabled
            javaScriptEnabled
            originWhitelist={["*"]}
            scrollEnabled={false}
            setSupportMultipleWindows={false}
            source={{ html: androidMapHtml }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {variant === "card" ? (
          <View style={styles.legendRow}>
            <Text style={styles.legendText}>Mapa compartido del convoy</Text>
            <Text style={styles.legendText}>{driverCount} conductores visibles</Text>
            <Text style={styles.legendText}>Naranja: tu equipo</Text>
            <Text style={styles.legendText}>Verde: online</Text>
            <Text style={styles.legendText}>Ambar: demorado</Text>
            <Text style={styles.legendText}>Rojo: offline</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, variant === "full" ? styles.wrapperFull : null]}>
      <View style={[styles.mapFrame, variant === "full" ? styles.mapFrameFull : null]}>
        <MapView
          ref={mapRef}
          initialRegion={initialRegion}
          style={StyleSheet.absoluteFill}
          showsCompass
          showsMyLocationButton={false}
          showsUserLocation={false}
          toolbarEnabled={false}
        >
          <Polyline
            coordinates={sortedMembers.map((member) => ({
              latitude: member.latestLocation.latitude,
              longitude: member.latestLocation.longitude,
            }))}
            strokeColor="#0b6b78"
            strokeWidth={4}
          />

          {sortedMembers.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const color = statusColor(member.connectionStatus);

            return (
              <Fragment key={member.userId}>
                <Circle
                  center={{
                    latitude: member.latestLocation.latitude,
                    longitude: member.latestLocation.longitude,
                  }}
                  radius={Math.max(member.latestLocation.accuracy, 6)}
                  fillColor={`${color}22`}
                  strokeColor={`${color}55`}
                  strokeWidth={1}
                />
                <Marker
                  coordinate={{
                    latitude: member.latestLocation.latitude,
                    longitude: member.latestLocation.longitude,
                  }}
                  pinColor={isCurrentUser ? "#e48649" : color}
                  title={markerTitle(member, currentUserId)}
                  description={`${member.role} · bateria ${member.latestLocation.batteryLevel}%`}
                />
              </Fragment>
            );
          })}
        </MapView>
      </View>

      {variant === "card" ? (
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>Mapa compartido del convoy</Text>
          <Text style={styles.legendText}>{driverCount} conductores visibles</Text>
          <Text style={styles.legendText}>Naranja: tu equipo</Text>
          <Text style={styles.legendText}>Verde: online</Text>
          <Text style={styles.legendText}>Ambar: demorado</Text>
          <Text style={styles.legendText}>Rojo: offline</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  wrapperFull: {
    flex: 1,
    gap: 0,
  },
  mapFrame: {
    height: 300,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#dce8e8",
  },
  mapFrameFull: {
    flex: 1,
    height: undefined,
    borderRadius: 0,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendText: {
    color: "#61757d",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    borderRadius: 20,
    backgroundColor: "#f4f8f8",
    padding: 18,
  },
  emptyStateFull: {
    flex: 1,
    borderRadius: 0,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#12343f",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyBody: {
    marginTop: 6,
    color: "#61757d",
    fontSize: 14,
    lineHeight: 20,
  },
});
