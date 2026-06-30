import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { appStyles, colors } from "../mobile-theme";
import { roleLabel } from "../mobile-utils";
import { DemoSeedResponse } from "../types";

type LoginScreenProps = {
  apiBaseUrl: string;
  loadingSeed: boolean;
  loginName: string;
  loginPhone: string;
  selectedUser: DemoSeedResponse["seed"]["demoUsers"][number] | null;
  submitting: boolean;
  tripCode: string;
  onApiBaseUrlChange: (value: string) => void;
  onLoginNameChange: (value: string) => void;
  onLoginPhoneChange: (value: string) => void;
  onTripCodeChange: (value: string) => void;
  onSubmit: () => void;
};

export function LoginScreen(props: LoginScreenProps) {
  return (
    <ScrollView
      style={appStyles.screen}
      contentContainerStyle={[appStyles.scrollContent, styles.content]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Viaje GPS · Cliente movil</Text>
        <Text style={styles.heroTitle}>Una experiencia de seguimiento pensada como app, no como web.</Text>
        <Text style={styles.heroBody}>
          Ingresa al viaje con tu codigo privado y comparte tu posicion con el monitor en tiempo real.
        </Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.eyebrow}>Conexion</Text>
        <Text style={appStyles.title}>Servidor del monitor</Text>
        <Text style={appStyles.label}>API base URL</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={props.onApiBaseUrlChange}
          style={appStyles.input}
          value={props.apiBaseUrl}
        />
        <Text style={appStyles.helper}>
          En produccion usa la URL publica. En local usa la IP de tu PC, por ejemplo `http://192.168.0.10:3000`.
        </Text>
      </View>

      <View style={[appStyles.card, appStyles.sectionSpacing]}>
        <Text style={appStyles.eyebrow}>Acceso al viaje</Text>
        <Text style={appStyles.title}>Entrar con codigo privado</Text>

        <Text style={appStyles.label}>Codigo del viaje</Text>
        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={props.onTripCodeChange}
          placeholder="Te lo entrega el monitor"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={appStyles.input}
          value={props.tripCode}
        />

        {props.loadingSeed ? (
          <View style={styles.inlineRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.inlineText}>Conectando con el servidor...</Text>
          </View>
        ) : null}

        <Text style={appStyles.label}>Tu nombre</Text>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={props.onLoginNameChange}
          placeholder="Ej. Martin Quiroga"
          placeholderTextColor={colors.textMuted}
          style={appStyles.input}
          value={props.loginName}
        />

        <Text style={appStyles.label}>Tu telefono</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="phone-pad"
          onChangeText={props.onLoginPhoneChange}
          placeholder="Ej. +54 388 455 1002"
          placeholderTextColor={colors.textMuted}
          style={appStyles.input}
          value={props.loginPhone}
        />

        {props.selectedUser ? (
          <View style={styles.infoPanel}>
            <Text style={styles.infoLabel}>Ingreso reconocido</Text>
            <Text style={styles.infoTitle}>{props.selectedUser.name}</Text>
            <Text style={styles.infoBody}>Rol: {roleLabel(props.selectedUser.role)}</Text>
          </View>
        ) : props.loginName.trim() ? (
          <View style={styles.infoPanel}>
            <Text style={styles.infoLabel}>Validacion</Text>
            <Text style={styles.infoTitle}>Nombre nuevo o aun no registrado</Text>
            <Text style={styles.infoBody}>Si no existe todavia, se crea como conductor cuando ingreses.</Text>
          </View>
        ) : null}

        <Pressable disabled={props.submitting} onPress={props.onSubmit} style={[appStyles.buttonPrimary, styles.submitButton]}>
          <Text style={appStyles.buttonPrimaryText}>
            {props.submitting ? "Conectando..." : "Entrar al viaje"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  hero: {
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 26,
    backgroundColor: "#0d2530",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  heroEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  heroTitle: {
    marginTop: 10,
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  heroBody: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  inlineRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inlineText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  infoPanel: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    padding: 14,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  infoTitle: {
    marginTop: 6,
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  infoBody: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  submitButton: {
    marginTop: 18,
  },
});
