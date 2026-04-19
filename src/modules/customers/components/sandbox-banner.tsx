"use client";

import React from 'react';
import { XStack, Text } from 'tamagui';

export const SandboxBanner: React.FC = () => {
  return (
    <XStack 
      backgroundColor="#0D47A1" 
      paddingVertical="$2" 
      paddingHorizontal="$4" 
      justifyContent="center" 
      alignItems="center"
      width="100%"
    >
      <Text 
        color="white" 
        fontSize="$2" 
        fontWeight="700" 
        letterSpacing={1.2}
      >
        SANDBOX ENVIRONMENT
      </Text>
    </XStack>
  );
};
