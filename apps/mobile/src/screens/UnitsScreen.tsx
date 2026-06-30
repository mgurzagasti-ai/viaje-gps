import { ScrollView, StyleSheet, Text, View } from "react-native";
import { UnitStatusCard } from "../components/UnitStatusCard";
import { appStyles, colors } from "../mobile-theme";
import { DashboardResponse, SessionResponse } from "../types";

type UnitsScreenProps = {
  dashboard: DashboardResponse | null;
  prioritizedMembers: {
    drivers: DashboardResponse["members"];
    others: DashboardResponse["members"];
  } | null;
  session: SessionResponse;
};

export function UnitsScreen({ dashboard, prioritizedMembers, session }: UnitsScreenProps) {
  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={[appStyles.scrollContent, appStyles.contentScreen]}>
      <Text style={appStyles.eyebrow}>Unidades</Text>
      <Text style={appStyles.title}>Estado de toda la flota</Text>
      <Text style={appStyles.body}>
        Tarjetas compactas con prioridad para conductores y menor cantidad de scroll para ubicar rapido cada equipo.
      </Text>

      <View style={[styles.headerMetricRow, appStyles.sectionSpacing]}>
        <View style={styles.headerMetric}>
          <Text style={styles.headerMetricLabel}>Conductores</Text>
          <Text style={styles.headerMetricValue}>{prioritizedMembers?.drivers.length ?? 0}</Text>
        </View>
        <View style={styles.headerMetric}>
          <Text style={styles.headerMetricLabel}>Resto del grupo</Text>
          <Text style={styles.headerMetricValue}>{prioritizedMembers?.others.length ?? 0}</Text>
        </View>
      </View>

      {dashboard && prioritizedMembers ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conductores</Text>
            <View style={styles.stack}>
              {prioritizedMembers.drivers.map((member) => (
                <UnitStatusCard
                  key={member.userId}
                  currentUserId={session.user.id}
                  member={member}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coordinacion y apoyo</Text>
            <View style={styles.stack}>
              {prioritizedMembers.others.map((member) => (
                <UnitStatusCard
                  key={member.userId}
                  currentUserId={session.user.id}
                  member={member}
                />
              ))}
            </View>
          </View>
        </>
      ) : (
        <View style={[appStyles.card, appStyles.sectionSpacing]}>
          <Text style={styles.emptyTitle}>Todavia no hay unidades visibles</Text>
          <Text style={appStyles.body}>
            En cuanto el grupo empiece a reportar GPS, las tarjetas van a aparecer aca.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerMetricRow: {
    flexDirection: "row",
    gap: 12,
  },
  headerMetric: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    padding: 16,
  },
  headerMetricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  headerMetricValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  section: {
    marginTop: 18,
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  stack: {
    gap: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
