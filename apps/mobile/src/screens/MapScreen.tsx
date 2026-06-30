import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { TripGroupMap } from "../TripGroupMap";
import { appStyles, colors } from "../mobile-theme";
import { roleLabel, statusLabel } from "../mobile-utils";
import { DashboardResponse, SessionResponse } from "../types";

type MapScreenProps = {
  autoSharing: boolean;
  dashboard: DashboardResponse | null;
  lastLocationSync: string | null;
  refreshing: boolean;
  session: SessionResponse;
  syncingLocation: boolean;
  onRefresh: () => void;
  onSendLocation: () => void;
  onToggleAutoSharing: (value: boolean) => void;
};

export function MapScreen(props: MapScreenProps) {
  const currentMember =
    props.dashboard?.members.find((member) => member.userId === props.session.user.id) ?? null;

  return (
    <View style={styles.screen}>
      <View style={styles.mapWrap}>
        <TripGroupMap
          currentUserId={props.session.user.id}
          members={props.dashboard?.members ?? []}
          variant="full"
        />

        <View style={styles.topOverlay}>
          <View>
            <Text style={styles.tripName}>{props.session.trip.name}</Text>
            <Text style={styles.tripRoute}>
              {props.session.trip.origin} a {props.session.trip.destination}
            </Text>
          </View>
          <View style={styles.livePill}>
            <Text style={styles.livePillText}>
              {props.dashboard ? "En vivo" : "Esperando datos"}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.flexOne}>
              <Text style={appStyles.eyebrow}>Unidad principal</Text>
              <Text style={styles.sheetTitle}>
                {currentMember ? (currentMember.userId === props.session.user.id ? "Vos" : currentMember.name) : props.session.user.name}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {roleLabel(props.session.user.role)} · {currentMember ? statusLabel(currentMember.connectionStatus) : "Sin conexion"}
              </Text>
            </View>
            <View style={styles.speedBadge}>
              <Text style={styles.speedValue}>
                {currentMember?.latestLocation?.speed
                  ? `${Math.round(currentMember.latestLocation.speed)} km/h`
                  : "0 km/h"}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ultima actualizacion</Text>
              <Text style={styles.statValue}>
                {props.lastLocationSync ?? "Sin envio"}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Checkpoint</Text>
              <Text style={styles.statValue}>{props.session.trip.checkpoint}</Text>
            </View>
          </View>

          <View style={styles.autoShareRow}>
            <View style={styles.flexOne}>
              <Text style={styles.autoShareTitle}>Autoenvio cada 30 segundos</Text>
              <Text style={styles.autoShareBody}>Mantiene al monitor actualizado sin cambiar de pantalla.</Text>
            </View>
            <Switch
              onValueChange={props.onToggleAutoSharing}
              thumbColor={props.autoSharing ? colors.accent : "#d9e2e8"}
              trackColor={{ false: "#314a57", true: "#165f6d" }}
              value={props.autoSharing}
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable
              disabled={props.syncingLocation}
              onPress={props.onSendLocation}
              style={[appStyles.buttonPrimary, styles.flexOne]}
            >
              <Text style={appStyles.buttonPrimaryText}>
                {props.syncingLocation ? "Enviando..." : "Enviar ubicacion"}
              </Text>
            </Pressable>
            <Pressable
              disabled={props.refreshing}
              onPress={props.onRefresh}
              style={appStyles.buttonSecondary}
            >
              <Text style={appStyles.buttonSecondaryText}>
                {props.refreshing ? "Actualizando..." : "Refrescar"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapWrap: {
    flex: 1,
  },
  topOverlay: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  tripName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  tripRoute: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  livePill: {
    borderRadius: 999,
    backgroundColor: "rgba(7,20,27,0.88)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  livePillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  bottomSheet: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 98,
    borderRadius: 28,
    backgroundColor: "rgba(8,20,27,0.96)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#44606d",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  flexOne: {
    flex: 1,
  },
  sheetTitle: {
    marginTop: 7,
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  sheetSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  speedBadge: {
    borderRadius: 22,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  speedValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  statsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: colors.surface,
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
    marginTop: 8,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  autoShareRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  autoShareTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  autoShareBody: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  actionRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },
});
