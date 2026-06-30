import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { BottomTabBar, MobileTabKey } from "../components/BottomTabBar";
import { StatusBanner } from "../components/StatusBanner";
import { colors } from "../mobile-theme";
import { AlertsScreen } from "../screens/AlertsScreen";
import { MapScreen } from "../screens/MapScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { UnitsScreen } from "../screens/UnitsScreen";
import { useMobileClientState } from "../hooks/useMobileClientState";

type MobileTabsProps = {
  client: ReturnType<typeof useMobileClientState>;
};

export function MobileTabs({ client }: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState<MobileTabKey>("map");

  return (
    <View style={styles.shell}>
      <View style={styles.content}>
        {activeTab === "map" ? (
          <MapScreen
            autoSharing={client.autoSharing}
            dashboard={client.dashboard}
            lastLocationSync={client.lastLocationSync}
            refreshing={client.refreshing}
            session={client.session!}
            syncingLocation={client.syncingLocation}
            onRefresh={() => void client.refreshDashboard()}
            onSendLocation={() => void client.submitCurrentLocation()}
            onToggleAutoSharing={(value) => {
              client.setAutoSharing(value);
              client.setFeedback(null);
            }}
          />
        ) : null}

        {activeTab === "units" ? (
          <UnitsScreen
            dashboard={client.dashboard}
            prioritizedMembers={client.prioritizedMembers}
            session={client.session!}
          />
        ) : null}

        {activeTab === "alerts" ? (
          <AlertsScreen
            dashboard={client.dashboard}
            sendingEmergency={client.sendingEmergency}
            onSendAccident={() => void client.handleEmergencyAlert("accident")}
            onSendSos={() => void client.handleEmergencyAlert("sos")}
          />
        ) : null}

        {activeTab === "reports" ? <ReportsScreen dashboard={client.dashboard} /> : null}

        {activeTab === "profile" ? (
          <ProfileScreen
            apiBaseUrl={client.apiBaseUrl}
            autoSharing={client.autoSharing}
            lastLocationSync={client.lastLocationSync}
            session={client.session!}
            onLogout={client.handleReset}
          />
        ) : null}
      </View>

      <View style={styles.bannerStack}>
        {client.feedback ? <StatusBanner type="success" message={client.feedback} /> : null}
        {client.error ? <StatusBanner type="error" message={client.error} /> : null}
      </View>

      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  bannerStack: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 102,
    gap: 10,
  },
});
