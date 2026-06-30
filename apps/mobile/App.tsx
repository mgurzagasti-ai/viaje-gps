import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileClientApp } from "./src/MobileClientApp";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <MobileClientApp />
    </SafeAreaProvider>
  );
}
