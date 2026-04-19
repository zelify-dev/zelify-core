"use client";

import React from 'react';
import { YStack, XStack, Text, Button, Separator, Input } from 'tamagui';
import { Plus, GripVertical } from 'lucide-react';

export const ColumnPresets: React.FC = () => {
  return (
    <YStack gap="$6" padding="$6" backgroundColor="$gray2" borderRadius="$4" borderTopWidth={1} borderTopColor="$borderColor">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="800" color="$color">Editing Custom Clients Preset</Text>
        <Text fontSize="$4" color="$gray11">Customise your view by selecting and ordering the columns you want to see.</Text>
      </YStack>

      <XStack gap="$10">
        {/* Available Columns */}
        <YStack flex={1} gap="$4">
          <Text fontWeight="700" color="$gray10" fontSize="$2">AVAILABLE COLUMNS</Text>
          <YStack gap="$2">
            {['Account State', 'Account Type', 'Address', 'Email Address', 'Mobile Number', 'Postal Code', 'Preferred Language'].map((col) => (
              <XStack key={col} padding="$2" alignItems="center" justifyContent="space-between" hoverStyle={{ backgroundColor: '$gray3' }} borderRadius="$2">
                <Text fontSize="$3">{col}</Text>
                <Button size="$1" icon={<Plus size={14} />} chromeless />
              </XStack>
            ))}
          </YStack>
        </YStack>

        {/* Selected Columns */}
        <YStack flex={2} gap="$4">
          <Text fontWeight="700" color="$gray10" fontSize="$2">SELECTED COLUMNS</Text>
          <XStack gap="$2" flexWrap="wrap">
            {['Full Name', 'ID', 'Client State', 'Credit Officer', 'Total Balance', 'Last Modified'].map((col) => (
              <XStack 
                key={col} 
                backgroundColor="white" 
                borderWidth={1} 
                borderColor="$borderColor" 
                borderRadius="$4" 
                paddingHorizontal="$3" 
                paddingVertical="$2" 
                alignItems="center" 
                gap="$2"
              >
                <GripVertical size={14} color="var(--gray8)" />
                <Text fontSize="$3" fontWeight="600">{col}</Text>
                <Button size="$1" icon={<Plus size={14} style={{ transform: [{ rotate: '45deg' }] }} />} chromeless />
              </XStack>
            ))}
            <Button 
              icon={<Plus size={16} />} 
              variant="outlined" 
              borderColor="#006064" 
              color="#006064" 
              borderRadius="$4"
              size="$3"
            >
              Add Column
            </Button>
          </XStack>
        </YStack>
      </XStack>

      <XStack gap="$3" justifyContent="flex-end" marginTop="$4">
        <Button variant="outlined" borderColor="$borderColor">Cancel</Button>
        <Button backgroundColor="#006064" color="white" hoverStyle={{ backgroundColor: '#004D40' }}>Save Changes</Button>
      </XStack>
    </YStack>
  );
};
