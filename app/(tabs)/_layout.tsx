import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const theme = {
  light: { active: '#c0392b', inactive: '#999', bg: '#fff' },
  dark: { active: '#e74c3c', inactive: '#666', bg: '#1a1a1e' },
} as const;

/** 图标、间距和一行中文标签所需高度，避免底栏把文字裁掉 */
const TAB_BAR_CONTENT_HEIGHT = 62;

function TabLabel({ color, children }: { color: string; children: string }) {
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      allowFontScaling={false}
      style={{
        color,
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'center',
        width: '100%',
        marginTop: 3,
        paddingHorizontal: 2,
        // 安卓默认字体内边距会把单行中文的上下沿裁掉
        includeFontPadding: false,
      }}
    >
      {children}
    </Text>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? theme.dark : theme.light;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.active,
        tabBarInactiveTintColor: t.inactive,
        tabBarLabelPosition: 'below-icon',
        tabBarIconSize: 22,
        tabBarAllowFontScaling: false,
        tabBarLabel: ({ color, children }) => <TabLabel color={color}>{children}</TabLabel>,
        tabBarItemStyle: { flex: 1, minWidth: 0 },
        tabBarStyle: {
          backgroundColor: t.bg,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
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
