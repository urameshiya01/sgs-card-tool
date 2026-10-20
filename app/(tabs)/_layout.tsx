import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

const theme = {
  light: { active: '#c0392b', inactive: '#999', bg: '#fff' },
  dark: { active: '#e74c3c', inactive: '#666', bg: '#1a1a1e' },
} as const;

export default function TabLayout() {
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? theme.dark : theme.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.active,
        tabBarInactiveTintColor: t.inactive,
        tabBarStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '牌库统计',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="probability"
        options={{
          title: '概率计算',
          tabBarIcon: ({ color, size }) => <Ionicons name="calculator" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="packs"
        options={{
          title: '卡包配置',
          tabBarIcon: ({ color, size }) => <Ionicons name="layers" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
