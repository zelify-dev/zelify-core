"use client";

import React, { useEffect, useState } from 'react';
import { YStack, XStack, ScrollView, Spinner, Text } from 'tamagui';
import { ZelifyTopNavbar } from '@/components/ui/organisms/topbar/zelify-top-navbar';
import { SandboxBanner } from '../components/sandbox-banner';
import { CustomerFilters } from '../components/customer-filters';
import { CustomerTable } from '../components/customer-table';
import { ColumnPresets } from '../components/column-presets';
import { customersService } from '../services/customers.service';
import { Customer } from '../types/customer.types';

export const CustomersListScreen: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customersService.getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <YStack flex={1} backgroundColor="$background" minHeight="100vh">
      <ZelifyTopNavbar />
      <SandboxBanner />
      
      <ScrollView>
        <YStack padding="$6" gap="$6" maxWidth={1400} marginHorizontal="auto" width="100%">
          {/* Page Header */}
          <YStack gap="$2" marginTop="$2">
            <Text fontSize="$9" fontWeight="800" color="$color">Clients</Text>
          </YStack>

          {/* Filters Section */}
          <CustomerFilters />

          {/* Table Section */}
          {loading ? (
            <YStack padding="$10" alignItems="center" justifyContent="center">
              <Spinner size="large" color="#006064" />
              <Text marginTop="$4" color="$gray10">Loading clients...</Text>
            </YStack>
          ) : (
            <CustomerTable customers={customers} />
          )}

          {/* Column Presets Section */}
          <ColumnPresets />
        </YStack>
      </ScrollView>
    </YStack>
  );
};
