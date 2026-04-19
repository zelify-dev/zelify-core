"use client";

import React, { useEffect, useState } from 'react';
import { YStack, XStack, Text, Button, Switch, ScrollView, Spinner } from 'tamagui';
import { Plus } from 'lucide-react';
import { ZelifyTopNavbar } from '@/components/ui/organisms/topbar/zelify-top-navbar';
import { SandboxBanner } from '@/modules/customers/components/sandbox-banner';
import { OrganizationSettingsHeader } from '../components/organization-settings-header';
import { UnitTable } from '../components/unit-table';
import { organizationsService } from '../services/organizations.service';
import { OrganizationUnit, UnitType } from '../types/organization.types';

export const OrganizationSettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UnitType>('branch');
  const [data, setData] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeactivated, setShowDeactivated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = activeTab === 'branch' 
          ? await organizationsService.getBranches() 
          : await organizationsService.getCentres();
        
        setData(showDeactivated ? result : result.filter(u => u.state !== 'DEACTIVATED'));
      } catch (error) {
        console.error('Error fetching organization data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, showDeactivated]);

  return (
    <YStack flex={1} background="$background" minHeight="100vh">
      <ZelifyTopNavbar activeItem="Administration" />
      <OrganizationSettingsHeader />

      <ScrollView>
        <YStack padding="$6" gap="$6" maxWidth={1400} marginHorizontal="auto" width="100%">
          {/* Sub-navigation and Actions */}
          <XStack 
            justifyContent="space-between" 
            alignItems="flex-end" 
            borderBottomWidth={1} 
            borderBottomColor="$borderColor" 
            paddingBottom="$2"
          >
            <XStack gap="$6">
              <PressableTab 
                label="Branches" 
                isActive={activeTab === 'branch'} 
                onPress={() => setActiveTab('branch')} 
              /><PressableTab 
                label="Centres" 
                isActive={activeTab === 'centre'} 
                onPress={() => setActiveTab('centre')} 
              />
            </XStack>

            <Button 
              background="#006064" 
              color="white" 
              icon={<Plus size={16} />}
              borderRadius="$4"
              onPress={() => console.log(`New ${activeTab}`)}
            >
              New {activeTab === 'branch' ? 'Branch' : 'Centre'}
            </Button>
          </XStack>

          {/* Filters Bar */}
          <XStack alignItems="center" gap="$3">
            <Switch 
              size="$2" 
              checked={showDeactivated} 
              onCheckedChange={setShowDeactivated}
              background={showDeactivated ? '#006064' : '$gray5'}
            >
              <Switch.Thumb />
            </Switch>
            <Text fontSize="$3" color="$gray11">Show deactivated {activeTab === 'branch' ? 'branches' : 'centres'}</Text>
          </XStack>

          {/* Table Section */}
          {loading ? (
            <YStack padding="$10" alignItems="center" justifyContent="center" minHeight={400}>
              <Spinner size="large" color="#006064" />
            </YStack>
          ) : (
            <YStack gap="$4">
              <UnitTable units={data} type={activeTab === 'branch' ? 'Branch' : 'Centre'} />
              <SandboxBanner />
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
};

const PressableTab: React.FC<{ label: string; isActive: boolean; onPress: () => void }> = ({ label, isActive, onPress }) => (
  <YStack 
    onPress={onPress} 
    cursor="pointer" 
    paddingBottom="$2" 
    borderBottomWidth={isActive ? 2 : 0} 
    borderBottomColor="#006064"
    marginBottom={-8}
  >
    <Text 
      fontSize="$4" 
      fontWeight={isActive ? "700" : "500"} 
      color={isActive ? "#006064" : "$gray10"}
    >
      {label}
    </Text>
  </YStack>
);
