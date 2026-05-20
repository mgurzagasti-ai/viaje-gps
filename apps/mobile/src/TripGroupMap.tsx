import { Fragment, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
import { DashboardResponse } from "./types";

type TripGroupMapProps = {
  currentUserId: string;
  members: DashboardResponse["members"];
};

type LocatedMember = DashboardResponse["members"][number] & {
  latestLocation: NonNullable<DashboardResponse["members"][number]["latestLocation"]>;
};

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

export function TripGroupMap({ currentUserId, members }: TripGroupMapProps) {
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

        return left.name.localeCompare(right.name, "es-AR");
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
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Todavia no hay ubicaciones para mostrar</Text>
        <Text style={styles.emptyBody}>
          Cuando el grupo empiece a compartir GPS, aca vas a ver el mapa real del
          recorrido.
        </Text>
      </View>
    );
  }

  const driverCount = sortedMembers.filter((member) => member.role === "driver").length;

  return (
    <View style={styles.wrapper}>
      <View style={styles.mapFrame}>
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

        <View style={styles.topBadgeRow}>
          <Text style={styles.topBadge}>Mapa compartido del convoy</Text>
          <Text style={styles.topBadge}>{driverCount} conductores visibles</Text>
        </View>
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Naranja: tu equipo</Text>
        <Text style={styles.legendText}>Verde: online</Text>
        <Text style={styles.legendText}>Ambar: demorado</Text>
        <Text style={styles.legendText}>Rojo: offline</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  mapFrame: {
    height: 300,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#dce8e8",
  },
  topBadgeRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  topBadge: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(11,58,71,0.82)",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 8,
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
