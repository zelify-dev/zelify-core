"use client";

import React, { useEffect, useState } from 'react';
import { YStack, XStack, ScrollView, Spinner, Text } from 'tamagui';
import { RecentActivityList } from '../components/recent-activity-list';
import { TaskList } from '../components/task-list';
import { FavoriteViews } from '../components/favorite-views';
import { CompanyIndicators } from '../components/company-indicators';
import { ZelifyTopNavbar } from '@/components/ui/organisms/topbar/zelify-top-navbar';
import { dashboardService } from '../services/dashboard.service';
import { DashboardData } from '../types/dashboard.types';

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dashboardService.getDashboardData();
        setData(result);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <YStack flex={1} backgroundColor="$background" minHeight="100vh">
        <ZelifyTopNavbar />
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$blue10" />
          <Text marginTop="$4" color="$gray10">Updating your dashboard...</Text>
        </YStack>
      </YStack>
    );
  }

  if (!data) return null;

  return (
    <YStack flex={1} backgroundColor="$background" minHeight="100vh">
      <ZelifyTopNavbar />
    <ScrollView backgroundColor="$background">
      <YStack padding="$6" gap="$8" maxWidth={1400} marginHorizontal="auto" width="100%">
        <YStack gap="$2" marginTop="$4">
          <Text fontSize="$9" fontWeight="800" color="$color">Operational Dashboard</Text>
          <Text fontSize="$4" color="$gray11">Welcome back. Here's a summary of the system activity.</Text>
        </YStack>

        <XStack gap="$8" flexWrap="wrap">
          {/* Left Column - Recent Activity */}
          <YStack flex={1.5} minWidth={400}>
            <RecentActivityList activities={data.activities} />
          </YStack>

          {/* Right Column - Tasks, Favorites, Indicators */}
          <YStack flex={1} minWidth={350} gap="$8">
            <TaskList tasks={data.tasks} />
            <FavoriteViews favorites={data.favorites} />
            <CompanyIndicators indicators={data.indicators} />
          </YStack>
        </XStack>
      </YStack>
    </ScrollView>
    </YStack>
  );
}