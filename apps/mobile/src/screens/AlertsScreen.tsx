import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { appStyles, colors } from "../mobile-theme";
import { formatTime } from "../mobile-utils";
import { DashboardResponse } from "../types";

type AlertsScreenProps = {
  dashboard: DashboardResponse | null;
  sendingEmergency: boolean;
  onSendAccident: () => void;
  onSendSos: () => void;
};

export function AlertsScreen(props: AlertsScreenProps) {
  const activeAlerts = props.dashboard?.activeEmergencyAlerts ?? [];

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={[appStyles.scrollContent, appStyles.contentScreen]}>
      <View style={styles.hero}>
        <Text style={appStyles.eyebrow}>Alertas</Text>
        <Text style={appStyles.title}>Accidente o pedido inmediato de ayuda</Text>
        <Text style={appStyles.body}>
          Desde aca puedes enviar el aviso y ver en una sola lista todos los eventos activos del convoy.
        </Text>

        <View style={styles.actionRow}>
          <Pressable
            disabled={props.sendingEmergency}
            onPress={props.onSendAccident}
            style={[styles.alertButton, styles.accidentButton]}
          >
            <Text style={styles.alertButtonText}>
              {props.sendingEmergency ? "Enviando..." : "Accidente"}
            </Text>
          </Pressable>
          <Pressable
            disabled={props.sendingEmergency}
            onPress={props.onSendSos}
            style={[styles.alertButton, styles.sosButton]}
          >
            <Text style={styles.alertButtonText}>
              {props.sendingEmergency ? "Enviando..." : "911 / Ayuda"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[appStyles.card, appStyles.sectionSpacing]}>
        <Text style={styles.sectionTitle}>Alertas activas</Text>
        {activeAlerts.length > 0 ? (
          <View style={styles.stack}>
            {activeAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertType}>
                    {alert.type === "accident" ? "Accidente" : "911"} · {alert.userName}
                  </Text>
                  <Text style={styles.alertTime}>{formatTime(alert.createdAt)}</Text>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertMeta}>{alert.userPhone}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={appStyles.body}>No hay alertas activas en este momento.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 26,
    backgroundColor: "rgba(255,107,107,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.24)",
    padding: 18,
  },
  actionRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },
  alertButton: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  accidentButton: {
    backgroundColor: "#d94c43",
  },
  sosButton: {
    backgroundColor: "#8b2840",
  },
  alertButtonText: {
    color: "#fff7f7",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  stack: {
    marginTop: 14,
    gap: 12,
  },
  alertCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,107,107,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.18)",
    padding: 14,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  alertType: {
    flex: 1,
    color: "#ffd0d0",
    fontSize: 14,
    fontWeight: "800",
  },
  alertTime: {
    color: colors.textMuted,
    fontSize: 12,
  },
  alertMessage: {
    marginTop: 8,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  alertMeta: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 12,
  },
});
