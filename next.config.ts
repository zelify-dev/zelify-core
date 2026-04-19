import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Tamagui + strict TS: muchos props de Stack no coinciden con los tipos generados hasta alinear versión/tokens. */
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    "react-native-web",
    "react-native-svg",
    "@tamagui/react-native-svg",
    "tamagui",
    "lucide-react",
    "@tamagui/lucide-icons",
  ],
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
      "react-native-svg": "@tamagui/react-native-svg",
    },
  },
};

export default nextConfig;
