"use client";

import React from 'react';
import { XStack, YStack, Text, Button, Select, Adapt, Sheet } from 'tamagui';
import { Home, Filter as FilterIcon, Pencil, X, ChevronDown } from 'lucide-react';

export const CustomerFilters: React.FC = () => {
  return (
    <YStack gap="$4" width="100%">
      {/* Primary Filters Bar */}
      <XStack gap="$3" alignItems="center" flexWrap="wrap">
        <XStack 
          backgroundColor="$background" 
          borderWidth={1} 
          borderColor="$borderColor" 
          borderRadius="$4" 
          paddingHorizontal="$3"
          paddingVertical="$2"
          alignItems="center"
          gap="$2"
          minWidth={200}
        >
          <Home size={16} color="var(--gray10)" />
          <Text fontSize="$3" color="$gray11">Branch</Text>
          <Text fontSize="$3" fontWeight="600" color="$color" flex={1}>All Branches</Text>
          <ChevronDown size={16} color="var(--gray10)" />
        </XStack>

        <Button 
          icon={<FilterIcon size={16} />} 
          backgroundColor="#a9fb5d" 
          color="#0d1b3d"
          borderRadius="$4"
          hoverStyle={{ backgroundColor: '#98e84a' }}
        >
          Filter
        </Button>
      </XStack>

      {/* Active Filters Display */}
      <XStack gap="$3" alignItems="center">
        <Text fontSize="$3" color="$gray10">Where</Text>
        <XStack 
          backgroundColor="$blue3" 
          paddingHorizontal="$3" 
          paddingVertical="$2" 
          borderRadius="$4" 
          alignItems="center" 
          gap="$3"
        >
          <Text fontSize="$3" color="$blue10">
            Birth Date is after <Text fontWeight="700">01-08-2000</Text>
          </Text>
          <XStack gap="$2">
            <Button size="$1" icon={<Pencil size={12} />} chromeless padding={0} />
            <Button size="$1" icon={<X size={12} />} chromeless padding={0} />
          </XStack>
        </XStack>
      </XStack>
    </YStack>
  );
};
