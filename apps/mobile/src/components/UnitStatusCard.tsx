import { StyleSheet, Text, View } from "react-native";
import { colors } from "../mobile-theme";
import { formatTime, roleLabel, statusLabel, statusTone } from "../mobile-utils";
import { DashboardResponse, SessionResponse } from "../types";

type UnitStatusCardProps = {
  currentUserId?: string;
  member: DashboardResponse["members"][number];
};

export function UnitStatusCard({ currentUserId, member }: UnitStatusCardProps) {
  const tone = statusTone(member.connectionStatus);
  const lastUpdate = member.latestLocation
    ? formatTime(member.latestLocation.recordedAt)
    : "Sin reporte";

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>
            {member.userId === currentUserId ? "Vos" : member.name}
          </Text>
          <Text style={styles.subtitle}>
            {roleLabel(member.role)} · {member.phone}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: tone.backgroundColor,
              borderColor: tone.borderColor,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: tone.color }]}>
            {statusLabel(member.connectionStatus)}
          </Text>
        </View>
      </View>

      {member.emergencyAlert ? (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            {member.emergencyAlert.type === "accident"
              ? "Accidente reportado"
              : "Pedido 911 activo"}
          </Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Velocidad</Text>
          <Text style={styles.statValue}>
            {member.latestLocation?.speed ? `${Math.round(member.latestLocation.speed)} km/h` : "0 km/h"}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Bateria</Text>
          <Text style={styles.statValue}>
            {member.latestLocation ? `${member.latestLocation.batteryLevel}%` : "Sin dato"}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          Ultima actualizacion: {lastUpdate}
        </Text>
        <Text style={styles.footerText}>
          {member.latestLocation
            ? `${member.latestLocation.latitude.toFixed(3)}, ${member.latestLocation.longitude.toFixed(3)}`
            : "Sin ubicacion"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  alertBanner: {
    borderRadius: 16,
    backgroundColor: "rgba(255,107,107,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  alertText: {
    color: "#ffb2b2",
    fontSize: 12,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  stat: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    padding: 12,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  statValue: {
    marginTop: 7,
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  footerRow: {
    gap: 6,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
