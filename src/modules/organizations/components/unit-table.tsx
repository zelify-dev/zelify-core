"use client";

import React from 'react';
import { YStack, XStack, Text, Button, Separator, Square } from 'tamagui';
import { ChevronLeft, ChevronRight, MoreHorizontal, GripVertical } from 'lucide-react';
import { OrganizationUnit, UnitState } from '../types/organization.types';

interface UnitTableProps {
  units: OrganizationUnit[];
  type: 'Branch' | 'Centre';
}

export const UnitTable: React.FC<UnitTableProps> = ({ units, type }) => {
  return (
    <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$4" overflow="hidden" background="$background">
      {/* Table Header */}
      <XStack background="$gray2" padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
        <Text flex={2} fontWeight="700" fontSize="$3" color="$gray11">NAME</Text><Text flex={1} fontWeight="700" fontSize="$3" color="$gray11">ID</Text><Text flex={1} fontWeight="700" fontSize="$3" color="$gray11">STATE</Text><Text flex={2} fontWeight="700" fontSize="$3" color="$gray11">ADDRESS</Text><Text flex={1} fontWeight="700" fontSize="$3" color="$gray11">CREATED</Text><Text flex={1} fontWeight="700" fontSize="$3" color="$gray11" textAlign="right">LAST MODIFIED</Text><Text width={40}></Text>
      </XStack>

      {/* Table Body */}
      <YStack separator={<Separator />}>
        {units.length === 0 ? (
          <YStack padding="$10" alignItems="center">
            <Text color="$gray10">No {type.toLowerCase()}s found.</Text>
          </YStack>
        ) : (
          units.map((unit) => (
            <XStack key={unit.id} padding="$4" alignItems="center" hoverStyle={{ background: '$gray1' }}>
              <XStack flex={2} alignItems="center" gap="$3">
                <GripVertical size={16} color="var(--gray8)" />
                <Text color="#006064" fontWeight="600" fontSize="$4" cursor="pointer" hoverStyle={{ textDecorationLine: 'underline' }}>
                  {unit.name}
                </Text>
              </XStack>
              <Text flex={1} color="$color" fontSize="$3">{unit.id}</Text>
              <XStack flex={1} alignItems="center" gap="$2">
                <Square size={10} borderRadius={2} background={unit.state === UnitState.ACTIVE ? '$green10' : '$gray8'} />
                <Text fontSize="$3" color="$color">
                  {unit.state.charAt(0) + unit.state.slice(1).toLowerCase()}
                </Text>
              </XStack>
              <Text flex={2} color="$color" fontSize="$3">{unit.address}</Text>
              <Text flex={1} color="$gray11" fontSize="$3">{unit.created}</Text>
              <Text flex={1} textAlign="right" color="$gray11" fontSize="$3">{unit.lastModified}</Text>
              <XStack width={40} justifyContent="center">
                <Button 
                  icon={<MoreHorizontal size={18} />} 
                  chromeless 
                  size="$2" 
                  circular 
                />
              </XStack>
            </XStack>
          ))
        )}
      </YStack>

      {/* Table Footer / Pagination */}
      <XStack padding="$4" background="$gray1" justifyContent="space-between" alignItems="center">
        <XStack alignItems="center" gap="$3">
          <Text fontSize="$3" color="$gray11">Show</Text>
          <XStack borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" paddingVertical="$1" background="white">
            <Text fontSize="$3" fontWeight="600">10</Text>
          </XStack>
        </XStack>

        <XStack alignItems="center" gap="$4">
          <Text fontSize="$3" color="$gray10">Total: {units.length}</Text>
          <XStack gap="$2">
            <Button icon={<ChevronLeft size={16} />} circular size="$3" disabled chromeless />
            <Button icon={<ChevronRight size={16} />} circular size="$3" disabled chromeless />
          </XStack>
        </XStack>
      </XStack>
    </YStack>
  );
};
