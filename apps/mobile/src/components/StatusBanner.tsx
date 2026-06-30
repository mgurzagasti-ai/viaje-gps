import { StyleSheet, Text, View } from "react-native";
import { colors } from "../mobile-theme";

type StatusBannerProps = {
  type: "success" | "error";
  message: string;
};

export function StatusBanner({ type, message }: StatusBannerProps) {
  const success = type === "success";

  return (
    <View
      style={[
        styles.banner,
        success ? styles.bannerSuccess : styles.bannerError,
      ]}
    >
      <Text style={[styles.text, success ? styles.textSuccess : styles.textError]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerSuccess: {
    backgroundColor: "rgba(41,194,127,0.12)",
    borderColor: "rgba(41,194,127,0.28)",
  },
  bannerError: {
    backgroundColor: "rgba(255,107,107,0.12)",
    borderColor: "rgba(255,107,107,0.26)",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  textSuccess: {
    color: "#a5f0c8",
  },
  textError: {
    color: "#ffc0c0",
  },
});
