import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBanner } from "./components/StatusBanner";
import { useMobileClientState } from "./hooks/useMobileClientState";
import { colors } from "./mobile-theme";
import { MobileTabs } from "./navigation/MobileTabs";
import { LoginScreen } from "./screens/LoginScreen";

export function MobileClientApp() {
  const client = useMobileClientState();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {!client.session ? (
        <>
          <LoginScreen
            apiBaseUrl={client.apiBaseUrl}
            loadingSeed={client.loadingSeed}
            loginName={client.loginName}
            loginPhone={client.loginPhone}
            selectedUser={client.selectedUser}
            submitting={client.submitting}
            tripCode={client.tripCode}
            onApiBaseUrlChange={client.setApiBaseUrl}
            onLoginNameChange={client.setLoginName}
            onLoginPhoneChange={client.setLoginPhone}
            onTripCodeChange={client.setTripCode}
            onSubmit={() => void client.handleLogin()}
          />
          <View style={styles.bannerStack}>
            {client.feedback ? <StatusBanner type="success" message={client.feedback} /> : null}
            {client.error ? <StatusBanner type="error" message={client.error} /> : null}
          </View>
        </>
      ) : (
        <MobileTabs client={client} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bannerStack: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    gap: 10,
  },
});
