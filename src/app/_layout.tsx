import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
        <Stack.Screen name="level/[id]" options={{ title: '' }} />
        <Stack.Screen name="preflop" options={{ title: 'Preflop Ranges' }} />
        <Stack.Screen name="showdown" options={{ title: 'Hand Rankings' }} />
      </Stack>
    </StatsProvider>
  );
}
