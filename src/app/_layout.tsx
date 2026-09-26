import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { drillTitle } from '@/drills';
import { StatsProvider } from '@/stats/StatsContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <StatsProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Poker Drills' }} />
        <Stack.Screen name="preflop" options={{ title: drillTitle('preflop') }} />
        <Stack.Screen name="pot-odds" options={{ title: drillTitle('potOdds') }} />
        <Stack.Screen name="showdown" options={{ title: drillTitle('showdown') }} />
        <Stack.Screen name="outs" options={{ title: drillTitle('outs') }} />
      </Stack>
    </StatsProvider>
  );
}
