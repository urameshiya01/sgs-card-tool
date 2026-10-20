import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { usePackConfig, hydratePackConfig } from '@/store/packConfigStore';
import { confirmDialog } from '@/lib/dialog';
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
    createPackFromPacks,
    deletePack,
    resetToDefaults,
  } = usePackConfig();

  useEffect(() => {
    if (!hydrated) void hydratePackConfig();
  }, [hydrated]);

  const [merging, setMerging] = useState(false);
  const [mergeName, setMergeName] = useState('');
  const [mergeSourceIds, setMergeSourceIds] = useState<string[]>([]);

  const allPacks = useMemo(() => [...officialPacks, ...customPacks], [officialPacks, customPacks]);

  const toggleMergeSource = (id: string) => {
    setMergeSourceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const handleCreateMerge = () => {
    if (mergeSourceIds.length === 0) return;
    const id = createPackFromPacks(mergeName, mergeSourceIds);
    if (id) {
      setMerging(false);
      setMergeName('');
      setMergeSourceIds([]);
      router.push(`/pack/${id}`);
    }
  };

  /** 默认卡包:官方 4 个 + 预置 2 个合并包 */
  const defaultPacks: CardPack[] = [...officialPacks, ...customPacks.filter((p) => p.id.startsWith('c-preset-'))];
  /** 用户自建的自定义卡包 */
  const userPacks: CardPack[] = customPacks.filter((p) => !p.id.startsWith('c-preset-'));

  const renderPackRow = (pack: CardPack, active: boolean) => (
    <View key={pack.id} style={styles.packRow}>
      <Text
        style={[styles.packName, active && styles.packNameActive]}
        onPress={() => toggleActive(pack.id)}
        numberOfLines={1}
      >
        {active ? '✓ ' : ''}
        {pack.name}
      </Text>
      <Text style={styles.packDesc} numberOfLines={1}>
        {pack.cards.length} 张 · {pack.composition}
      </Text>
      <View style={styles.packActions}>
        {!pack.official && (
          <Text style={styles.linkBtn} onPress={() => router.push(`/pack/${pack.id}`)}>
            编辑
          </Text>
        )}
        {!pack.official && !pack.id.startsWith('c-preset-') && (
          <Text style={[styles.linkBtn, styles.dangerBtn]} onPress={() => {
            void confirmDialog('删除卡包', `确定删除「${pack.name}」?`).then((ok) => {
              if (ok) deletePack(pack.id);
            });
          }}>
            删除
          </Text>
        )}
        {pack.official && <Text style={styles.officialTag}>🔒 官方</Text>}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>卡包配置</Text>

      <Text style={styles.sectionTitle}>默认卡包</Text>
      <View style={styles.card}>
        {defaultPacks.map((p) => renderPackRow(p, activePackIds.includes(p.id)))}
      </View>

      <Text style={styles.sectionTitle}>自定义卡包</Text>
      <View style={styles.card}>
        {userPacks.length === 0 && (
          <Text style={styles.emptyHint}>还没有自定义卡包,点击下方按钮创建</Text>
        )}
        {userPacks.map((p) => renderPackRow(p, activePackIds.includes(p.id)))}

        {merging ? (
          <View style={styles.mergeForm}>
            <TextInput
              style={styles.input}
              value={mergeName}
              onChangeText={setMergeName}
              placeholder="卡包名称(如:我的军争)"
              placeholderTextColor={dark ? '#666' : '#aaa'}
            />
            <Text style={styles.mergeLabel}>选择要合并的卡包(可多选):</Text>
            <View style={styles.mergeChips}>
              {allPacks.map((p) => (
                <Text
                  key={p.id}
                  style={[styles.chip, mergeSourceIds.includes(p.id) && styles.chipActive]}
                  onPress={() => toggleMergeSource(p.id)}
                >
                  {mergeSourceIds.includes(p.id) ? '✓ ' : ''}
                  {p.name}
                </Text>
              ))}
            </View>
            <View style={styles.mergeActions}>
              <Text style={styles.primaryBtn} onPress={handleCreateMerge}>
                创建合并卡包
              </Text>
              <Text
                style={styles.cancelBtn}
                onPress={() => {
                  setMerging(false);
                  setMergeSourceIds([]);
                }}
              >
                取消
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.primaryBtn} onPress={() => setMerging(true)}>
              ＋ 合并卡包生成新卡包
            </Text>
            <Text
              style={styles.secondaryBtn}
              onPress={() => {
                const id = createPack('');
                if (id) router.push(`/pack/${id}`);
              }}
            >
              ＋ 新建空白卡包(手动加卡)
            </Text>
          </>
        )}

        <Text style={styles.resetLink} onPress={resetToDefaults}>
          恢复默认自定义卡包
        </Text>
      </View>
    </ScrollView>
  );
}

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
    card: {
      backgroundColor: dark ? '#1e1e22' : '#fff',
      borderRadius: 12,
      padding: 14,
      shadowColor: '#000',
      shadowOpacity: dark ? 0 : 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    packRow: {
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: dark ? '#2c2c30' : '#eee',
    },
    packName: { fontSize: 16, fontWeight: '700', color: dark ? '#eee' : '#222' },
    packNameActive: { color: '#c0392b' },
    packDesc: { fontSize: 12, color: dark ? '#888' : '#777', marginTop: 3 },
    packActions: { flexDirection: 'row', gap: 16, marginTop: 8, alignItems: 'center' },
    linkBtn: { fontSize: 14, color: '#2980b9' },
    dangerBtn: { color: '#c0392b' },
    officialTag: { fontSize: 12, color: dark ? '#666' : '#999' },
    emptyHint: { fontSize: 13, color: dark ? '#666' : '#999', paddingVertical: 8 },
    primaryBtn: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
      backgroundColor: '#c0392b',
      borderRadius: 10,
      paddingVertical: 11,
      overflow: 'hidden',
      marginTop: 12,
    },
    secondaryBtn: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: '#c0392b',
      borderWidth: 1,
      borderColor: '#c0392b',
      borderRadius: 10,
      paddingVertical: 10,
      overflow: 'hidden',
      marginTop: 8,
    },
    resetLink: { textAlign: 'center', fontSize: 13, color: '#2980b9', paddingTop: 12 },
    mergeForm: { marginTop: 12 },
    input: {
      borderWidth: 1,
      borderColor: dark ? '#3a3a40' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: dark ? '#eee' : '#222',
    },
    mergeLabel: { fontSize: 13, color: dark ? '#888' : '#777', marginTop: 10, marginBottom: 6 },
    mergeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      fontSize: 13,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: dark ? '#2a2a30' : '#f0f0f2',
      color: dark ? '#ccc' : '#444',
      overflow: 'hidden',
    },
    chipActive: { backgroundColor: '#c0392b', color: '#fff', fontWeight: '700' },
    mergeActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
    cancelBtn: { fontSize: 14, color: dark ? '#888' : '#666' },
  });
