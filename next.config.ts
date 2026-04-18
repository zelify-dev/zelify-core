import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "react-native-web",
    "react-native-svg",
    "@tamagui/react-native-svg",
    "tamagui",
  ],
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
      "react-native-svg": "@tamagui/react-native-svg",
    },
  },
};

export default nextConfig;
