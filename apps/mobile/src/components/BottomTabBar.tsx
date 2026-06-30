import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../mobile-theme";

export type MobileTabKey = "map" | "units" | "alerts" | "reports" | "profile";

const tabs: Array<{ key: MobileTabKey; label: string; short: string }> = [
  { key: "map", label: "Mapa", short: "MAP" },
  { key: "units", label: "Unidades", short: "UNI" },
  { key: "alerts", label: "Alertas", short: "ALT" },
  { key: "reports", label: "Reportes", short: "REP" },
  { key: "profile", label: "Perfil", short: "PER" },
];

type BottomTabBarProps = {
  activeTab: MobileTabKey;
  onChange: (tab: MobileTabKey) => void;
};

export function BottomTabBar({ activeTab, onChange }: BottomTabBarProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={[styles.item, active ? styles.itemActive : null]}
            >
              <Text style={[styles.short, active ? styles.shortActive : null]}>
                {tab.short}
              </Text>
              <Text style={[styles.label, active ? styles.labelActive : null]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(10,23,31,0.96)",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  item: {
    flex: 1,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingHorizontal: 6,
    gap: 3,
  },
  itemActive: {
    backgroundColor: colors.accent,
  },
  short: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  shortActive: {
    color: colors.textDark,
  },
  label: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.textDark,
  },
});
