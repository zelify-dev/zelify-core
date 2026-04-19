"use client";

import React from 'react';
import { XStack, YStack, Text } from 'tamagui';
import { NavTab } from '@/components/ui/molecules/nav-tab/nav-tab';

export const OrganizationSettingsHeader: React.FC = () => {
  const tabs = [
    { label: 'General Setup', href: '/settings/general' },
    { label: 'Financial Setup', href: '/settings/financial' },
    { label: 'Organization', href: '/settings/organization', isActive: true },
    { label: 'Access', href: '/settings/access' },
    { label: 'Products', href: '/settings/products' },
    { label: 'Forms', href: '/settings/forms' },
    { label: 'Data', href: '/settings/data' },
    { label: 'Tasks', href: '/settings/tasks' },
    { label: 'Webhooks', href: '/settings/webhooks' },
  ];

  return (
    <YStack borderBottomWidth={1} borderBottomColor="$borderColor" backgroundColor="$background">
      <XStack 
        paddingHorizontal="$6" 
        gap="$6" 
        height={48} 
        alignItems="center"
        overflow="scroll"
      >
        {tabs.map((tab) => (
          <NavTab 
            key={tab.label} 
            label={tab.label} 
            href={tab.href} 
            isActive={tab.isActive} 
          />
        ))}
      </XStack>
    </YStack>
  );
};
