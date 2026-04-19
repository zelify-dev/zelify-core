"use client";

import React from 'react';
import { YStack, XStack, Text, Button, Separator, Square } from 'tamagui';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Customer, ClientState } from '../types/customer.types';

interface CustomerTableProps {
  customers: Customer[];
}

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers }) => {
  return (
    <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$4" overflow="hidden" backgroundColor="$background">
      {/* Table Header */}
      <XStack backgroundColor="$gray2" padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
        <Text flex={2} fontWeight="700" fontSize="$3" color="$gray11">FULL NAME</Text>
        <Text flex={1} fontWeight="700" fontSize="$3" color="$gray11">ID</Text>
        <Text flex={1} fontWeight="700" fontSize="$3" color="$gray11">CLIENT STATE</Text>
        <Text flex={1.5} fontWeight="700" fontSize="$3" color="$gray11">CREDIT OFFICER</Text>
        <Text flex={1} fontWeight="700" fontSize="$3" color="$gray11" textAlign="right">TOTAL BALANCE</Text>
        <Text flex={1} fontWeight="700" fontSize="$3" color="$gray11" textAlign="right">LAST MODIFIED</Text>
      </XStack>

      {/* Table Body */}
      <YStack separator={<Separator />}>
        {customers.map((customer) => (
          <XStack key={customer.id} padding="$4" alignItems="center" hoverStyle={{ backgroundColor: '$gray1' }}>
            <Text flex={2} color="#006064" fontWeight="600" fontSize="$4" cursor="pointer" hoverStyle={{ textDecorationLine: 'underline' }}>
              {customer.fullName}
            </Text>
            <Text flex={1} color="$color" fontSize="$3">{customer.id}</Text>
            <XStack flex={1} alignItems="center" gap="$2">
              <StatusIndicator state={customer.state} />
              <Text fontSize="$3" color="$color">
                {customer.state.charAt(0) + customer.state.slice(1).toLowerCase()}
              </Text>
            </XStack>
            <Text flex={1.5} color="$gray11" fontSize="$3">{customer.creditOfficer || '—'}</Text>
            <Text flex={1} textAlign="right" fontWeight="600" fontSize="$3" color={customer.totalBalance < 0 ? '$red10' : '$color'}>
              {formatCurrency(customer.totalBalance)}
            </Text>
            <Text flex={1} textAlign="right" color="$gray11" fontSize="$3">{customer.lastModified}</Text>
          </XStack>
        ))}
      </YStack>

      {/* Table Footer / Pagination */}
      <XStack padding="$4" backgroundColor="$gray1" justifyContent="space-between" alignItems="center">
        <XStack alignItems="center" gap="$3">
          <Text fontSize="$3" color="$gray11">Show</Text>
          <XStack borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" paddingVertical="$1" backgroundColor="white">
            <Text fontSize="$3" fontWeight="600">25</Text>
          </XStack>
        </XStack>

        <XStack alignItems="center" gap="$4">
          <Text fontSize="$3" color="$gray10">All {customers.length}</Text>
          <XStack gap="$2">
            <Button icon={<ChevronLeft size={16} />} circular size="$3" disabled chromeless />
            <Button icon={<ChevronRight size={16} />} circular size="$3" disabled chromeless />
          </XStack>
        </XStack>
      </XStack>
    </YStack>
  );
};

const StatusIndicator: React.FC<{ state: ClientState }> = ({ state }) => {
  let color = '$green10';
  if (state === ClientState.INACTIVE) color = '$orange10';
  if (state === ClientState.BLACKLISTED) color = '$red10';
  if (state === ClientState.PENDING) color = '$blue10';

  return <Square size={10} borderRadius={2} backgroundColor={color} />;
};

const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
  
  return amount < 0 ? `€-${formatted.replace('€', '').trim()}` : formatted;
};
