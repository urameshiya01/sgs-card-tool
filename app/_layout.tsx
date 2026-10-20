import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: dark ? '#111' : '#f5f5f7' },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="pack/[id]"
        options={{ headerShown: true, title: '卡包编辑', presentation: 'card' }}
      />
    </Stack>
  );
}
