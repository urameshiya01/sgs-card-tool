import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { usePackConfig, hydratePackConfig } from '@/store/packConfigStore';
import type { CardPack } from '@/lib/packs';

export default function PacksScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const styles = useMemo(() => createStyles(dark), [dark]);
  const router = useRouter();

  const {
    officialPacks,
    customPacks,
    activePackIds,
    hydrated,
    toggleActive,
    createPack,
    deletePack,
    resetToDefaults,
  } = usePackConfig();

  useEffect(() => {
    if (!hydrated) void hydratePackConfig();
  }, [hydrated]);

  const handleCreate = () => {
    // 默认:复制「标准版+EX」组成;进入后可在编辑页调整
    const sources = ['std', 'ex'].filter((id) => !activePackIds.includes(id) || true);
    createPack(`自定义卡包 ${customPacks.length + 1}`, sources);
  };

  const renderPack = (pack: CardPack, active: boolean) => (
    <View key={pack.id} style={styles.packCard}>
      <Text
        style={[styles.packMain, active && styles.packMainActive]}
        onPress={() => toggleActive(pack.id)}
      >
        {active ? '✓ ' : ''}
        {pack.name}
      </Text>
      <Text style={styles.packDesc}>{pack.description}</Text>
      <View style={styles.packActions}>
        {!pack.official && (
          <>
            <Text style={styles.linkBtn} onPress={() => router.push(`/pack/${pack.id}`)}>
              编辑
            </Text>
            <Text
              style={[styles.linkBtn, styles.dangerBtn]}
              onPress={() => deletePack(pack.id)}
            >
              删除卡包
            </Text>
          </>
        )}
        {pack.official && (
          <Text style={styles.officialTag}>官方标准卡包 · 不可修改</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>卡包配置</Text>

      <Text style={styles.sectionTitle}>自定义卡包(点名称切换激活)</Text>
      {customPacks.map((p) => renderPack(p, activePackIds.includes(p.id)))}
      <Text style={styles.primaryBtn} onPress={handleCreate}>
        ＋ 新建合并卡包
      </Text>
      <Text style={styles.resetBtn} onPress={resetToDefaults}>
        恢复默认自定义卡包
      </Text>

      <Text style={styles.sectionTitle}>标准卡包(官方,不可修改)</Text>
      {officialPacks.map((p) => renderPack(p, activePackIds.includes(p.id)))}
    </ScrollView>
  );
}

import { useMemo } from 'react';

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: dark ? '#111' : '#f5f5f7' },
    content: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 22, fontWeight: '700', color: dark ? '#fff' : '#1c1c1e', marginBottom: 12 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: dark ? '#ccc' : '#555',
      marginTop: 20,
      marginBottom: 8,
    },
    packCard: {
      backgroundColor: dark ? '#1e1e22' : '#fff',
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOpacity: dark ? 0 : 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    packMain: { fontSize: 17, fontWeight: '700', color: dark ? '#eee' : '#222' },
    packMainActive: { color: '#c0392b' },
    packDesc: { fontSize: 12, color: dark ? '#888' : '#777', marginTop: 4 },
    packActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
    linkBtn: { fontSize: 14, color: '#2980b9' },
    dangerBtn: { color: '#c0392b' },
    officialTag: { fontSize: 12, color: dark ? '#666' : '#999' },
    primaryBtn: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
      backgroundColor: '#c0392b',
      borderRadius: 10,
      paddingVertical: 12,
      overflow: 'hidden',
      marginTop: 4,
    },
    resetBtn: {
      textAlign: 'center',
      fontSize: 13,
      color: '#2980b9',
      paddingVertical: 10,
    },
  });
