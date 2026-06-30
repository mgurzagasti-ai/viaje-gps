import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MetricCard } from "../components/MetricCard";
import { appStyles, colors } from "../mobile-theme";
import { DashboardResponse } from "../types";

type ReportsScreenProps = {
  dashboard: DashboardResponse | null;
};

export function ReportsScreen({ dashboard }: ReportsScreenProps) {
  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={[appStyles.scrollContent, appStyles.contentScreen]}>
      <Text style={appStyles.eyebrow}>Reportes</Text>
      <Text style={appStyles.title}>Resumen operativo del viaje</Text>
      <Text style={appStyles.body}>
        Una vista corta de indicadores y bitacora para revisar la salud del convoy sin volver al monitor web.
      </Text>

      {dashboard ? (
        <>
          <View style={styles.metricsRow}>
            <MetricCard label="Activos" value={dashboard.summary.activeTravelers} />
            <MetricCard label="Demorados" value={dashboard.summary.delayedTravelers} />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard label="Ultima act." value={`${dashboard.summary.latestUpdateSeconds}s`} />
            <MetricCard
              label="Alertas"
              value={dashboard.summary.activeEmergencyAlerts}
              tone="danger"
            />
          </View>
          <View style={[appStyles.card, appStyles.sectionSpacing]}>
            <Text style={styles.sectionTitle}>Bitacora reciente</Text>
            <View style={styles.stack}>
              {dashboard.recentEvents.map((event) => (
                <View key={event} style={styles.eventCard}>
                  <View style={styles.eventDot} />
                  <Text style={styles.eventText}>{event}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      ) : (
        <View style={[appStyles.card, appStyles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Sin datos todavia</Text>
          <Text style={appStyles.body}>Los reportes aparecen despues de iniciar sesion y recibir el dashboard del viaje.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
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
  eventCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    padding: 14,
  },
  eventDot: {
    marginTop: 4,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.accentWarm,
  },
  eventText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
});
