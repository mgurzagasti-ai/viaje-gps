import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { appStyles, colors } from "../mobile-theme";
import { roleLabel } from "../mobile-utils";
import { SessionResponse } from "../types";

type ProfileScreenProps = {
  apiBaseUrl: string;
  autoSharing: boolean;
  lastLocationSync: string | null;
  session: SessionResponse;
  onLogout: () => void;
};

export function ProfileScreen(props: ProfileScreenProps) {
  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={[appStyles.scrollContent, appStyles.contentScreen]}>
      <View style={styles.hero}>
        <Text style={appStyles.eyebrow}>Perfil</Text>
        <Text style={appStyles.title}>{props.session.user.name}</Text>
        <Text style={styles.heroMeta}>
          {roleLabel(props.session.user.role)} · {props.session.user.phone}
        </Text>
      </View>

      <View style={[appStyles.card, appStyles.sectionSpacing]}>
        <Text style={styles.sectionTitle}>Sesion del viaje</Text>
        <Text style={styles.sectionValue}>{props.session.trip.name}</Text>
        <Text style={appStyles.body}>
          {props.session.trip.origin} a {props.session.trip.destination}
        </Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Checkpoint</Text>
            <Text style={styles.infoValue}>{props.session.trip.checkpoint}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Autoenvio</Text>
            <Text style={styles.infoValue}>{props.autoSharing ? "Activo" : "Pausado"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Ultimo sync</Text>
            <Text style={styles.infoValue}>{props.lastLocationSync ?? "Sin envio"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Servidor</Text>
            <Text style={styles.infoValue}>{props.apiBaseUrl}</Text>
          </View>
        </View>

        {props.session.trip.alternativeCheckpoints.length > 0 ? (
          <View style={styles.routeBlock}>
            <Text style={styles.infoLabel}>Paradas operativas</Text>
            <Text style={styles.routeValue}>
              {props.session.trip.alternativeCheckpoints.join(" · ")}
            </Text>
          </View>
        ) : null}

        <Pressable onPress={props.onLogout} style={[appStyles.buttonSecondary, styles.logoutButton]}>
          <Text style={appStyles.buttonSecondaryText}>Salir del viaje</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 26,
    backgroundColor: colors.surfaceRaised,
    padding: 18,
  },
  heroMeta: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  infoGrid: {
    marginTop: 16,
    gap: 12,
  },
  infoCard: {
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    padding: 14,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  infoValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  routeBlock: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    padding: 14,
  },
  routeValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 18,
  },
});
