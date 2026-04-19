"use client";

import { YStack, Text } from "tamagui";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";

type WorkspacePlaceholderScreenProps = {
  title: string;
};

export function WorkspacePlaceholderScreen({ title }: WorkspacePlaceholderScreenProps) {
  return (
    <YStack flex={1} backgroundColor="$background" minHeight="100vh">
      <ZelifyTopNavbar />
      <YStack padding="$6" gap="$2" maxWidth={1400} marginHorizontal="auto" width="100%">
        <Text fontSize="$9" fontWeight="800" color="$color">
          {title}
        </Text>
        <Text color="$gray10">Contenido próximamente.</Text>
      </YStack>
    </YStack>
  );
}
