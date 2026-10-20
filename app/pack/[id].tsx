import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { countByKind, countByName, countBySuit } from '@/lib/cards';
import type { CardKind, Suit } from '@/lib/cards';
import { OFFICIAL_PACKS } from '@/data/officialPacks';
import { usePackConfig, packById } from '@/store/packConfigStore';

const KIND_ORDER: CardKind[] = ['基本牌', '锦囊牌', '装备牌'];

export default function PackEditScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const styles = useMemo(() => createStyles(dark), [dark]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const { officialPacks, customPacks, renamePack, removeCard, restoreCards } = usePackConfig();
  const pack = packById(officialPacks, customPacks, id ?? '');

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<'name' | 'kind' | 'suit'>('name');

  if (!pack) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>卡包不存在或已被删除</Text>
        <Text style={styles.backLink} onPress={() => router.back()}>
          返回
        </Text>
      </View>
    );
  }

  const removable = !pack.official;
  const byName = countByName(pack.cards);
  const byKind = countByKind(pack.cards);
  const bySuit = countBySuit(pack.cards);

  const handleRemove = (cardId: string, cardName: string) => {
    Alert.alert('删除卡牌', `确定从「${pack.name}」中删除 1 张「${cardName}」?`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => removeCard(pack.id, cardId) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{pack.name}</Text>
      <Text style={styles.desc}>
        {pack.description} · 当前 {pack.cards.length} 张
        {removable ? '' : ' · 官方标准卡包不可修改'}
      </Text>

      {removable && (
        <View style={styles.toolbar}>
          <TextInput
            style={styles.renameInput}
            defaultValue={pack.name}
            placeholder="重命名卡包"
            placeholderTextColor={dark ? '#666' : '#aaa'}
            onSubmitEditing={(e) => renamePack(pack.id, e.nativeEvent.text)}
          />
          <Text style={styles.restoreBtn} onPress={() => restoreCards(pack.id)}>
            恢复全部已删牌
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>概览</Text>
      <View style={styles.card}>
        <Text style={styles.overviewLine}>
          类型:{KIND_ORDER.map((k) => `${k} ${byKind[k]}`).join(' · ')}
        </Text>
        <Text style={styles.overviewLine}>
          花色:♠{bySuit['♠']} ♥{bySuit['♥']} ♣{bySuit['♣']} ♦{bySuit['♦']}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>按牌名管理(点「删」移除一张)</Text>
      <View style={styles.card}>
        <View style={styles.groupRow}>
          {(['name', 'kind', 'suit'] as const).map((g) => (
            <Text
              key={g}
              style={[styles.groupChip, group === g && styles.groupChipActive]}
              onPress={() => setGroup(g)}
            >
              {g === 'name' ? '全部' : g === 'kind' ? '按类型' : '按花色'}
            </Text>
          ))}
          {removable && (
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="搜索牌名"
              placeholderTextColor={dark ? '#666' : '#aaa'}
            />
          )}
        </View>

        {byName
          .filter((e) => !query || e.name.includes(query))
          .map(({ name }) => {
            const copies = pack.cards.filter((c) => c.name === name);
            if (group === 'kind' || group === 'suit') {
              // 分组视图:只显示数量,不逐张列出
              return (
                <View key={name} style={styles.nameRow}>
                  <Text style={styles.cardName}>{name}</Text>
                  <Text style={styles.cardMeta}>
                    {copies[0].kind} · {copies[0].suit} · ×{copies.length}
                  </Text>
                </View>
              );
            }
            return (
              <View key={name} style={styles.nameRow}>
                <Text style={styles.cardName}>{name}</Text>
                <View style={styles.copies}>
                  {copies.map((c) => (
                    <Text
                      key={c.id}
                      style={[styles.copyChip, !removable && styles.copyChipDisabled]}
                      onPress={removable ? () => handleRemove(c.id, c.name) : undefined}
                    >
                      {c.suit}
                      {c.rank}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: dark ? '#111' : '#f5f5f7' },
    content: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 22, fontWeight: '700', color: dark ? '#fff' : '#1c1c1e' },
    desc: { fontSize: 13, color: dark ? '#888' : '#777', marginTop: 4 },
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
    renameInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: dark ? '#3a3a40' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
      fontSize: 14,
      color: dark ? '#eee' : '#222',
    },
    restoreBtn: { fontSize: 13, color: '#2980b9' },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: dark ? '#ccc' : '#555',
      marginTop: 18,
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
    overviewLine: { fontSize: 13, color: dark ? '#bbb' : '#555', marginVertical: 3 },
    groupRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    groupChip: {
      fontSize: 13,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: dark ? '#2a2a30' : '#f0f0f2',
      color: dark ? '#ccc' : '#444',
      overflow: 'hidden',
    },
    groupChipActive: { backgroundColor: '#c0392b', color: '#fff', fontWeight: '700' },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: dark ? '#3a3a40' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 13,
      color: dark ? '#eee' : '#222',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: dark ? '#2c2c30' : '#eee',
    },
    cardName: { width: 92, fontSize: 14, color: dark ? '#ddd' : '#333' },
    cardMeta: { fontSize: 13, color: dark ? '#888' : '#777' },
    copies: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    copyChip: {
      fontSize: 13,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: dark ? '#2a2a30' : '#f0f0f2',
      color: dark ? '#ccc' : '#444',
      overflow: 'hidden',
    },
    copyChipDisabled: { opacity: 0.6 },
    empty: { textAlign: 'center', marginTop: 80, fontSize: 15, color: '#888' },
    backLink: { textAlign: 'center', marginTop: 16, fontSize: 14, color: '#2980b9' },
  });
