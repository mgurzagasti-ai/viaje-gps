import { StyleSheet, Text, View } from "react-native";
import { colors } from "../mobile-theme";

type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: "default" | "danger";
};

export function MetricCard({ label, value, tone = "default" }: MetricCardProps) {
  return (
    <View style={[styles.card, tone === "danger" ? styles.cardDanger : null]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 102,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  cardDanger: {
    backgroundColor: "rgba(255,107,107,0.12)",
    borderColor: "rgba(255,107,107,0.2)",
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  value: {
    marginTop: 8,
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
});
