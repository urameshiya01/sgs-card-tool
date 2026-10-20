import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { DECK, DECK_SIZE } from '@/data/sgsDeck';
import { countByKind, countByName, countBySuit } from '@/lib/cards';
import type { CardKind, Suit } from '@/lib/cards';

const KIND_ORDER: CardKind[] = ['基本牌', '锦囊牌', '装备牌'];
const SUIT_ORDER: Suit[] = ['♠', '♥', '♣', '♦'];

const KIND_COLORS: Record<CardKind, string> = {
  基本牌: '#e74c3c',
  锦囊牌: '#8e44ad',
  装备牌: '#2980b9',
};

const SUIT_COLORS: Record<Suit, string> = {
  '♠': '#2c3e50',
  '♥': '#e74c3c',
  '♣': '#27ae60',
  '♦': '#e67e22',
};

export default function DeckStatsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const styles = useMemo(() => createStyles(dark), [dark]);

  const [selectedKind, setSelectedKind] = useState<CardKind | null>(null);

  const byKind = countByKind(DECK);
  const bySuit = countBySuit(DECK);
  const byName = countByName(DECK);
  const shownNames = selectedKind
    ? byName.filter((entry) =>
        DECK.some((c) => c.name === entry.name && c.kind === selectedKind),
      )
    : byName;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>牌库总览</Text>
      <View style={styles.card}>
        <Text style={styles.bigNumber}>{DECK_SIZE}</Text>
        <Text style={styles.bigLabel}>张游戏牌(标准版 + EX)</Text>
      </View>

      <Text style={styles.sectionTitle}>按类型统计</Text>
      <View style={styles.card}>
        {KIND_ORDER.map((kind) => {
          const count = byKind[kind];
          const pct = count / DECK_SIZE;
          const selected = selectedKind === kind;
          return (
            <View key={kind} style={styles.row}>
              <Text
                style={[styles.rowLabel, selected && styles.rowLabelSelected]}
                onPress={() => setSelectedKind(selected ? null : kind)}
              >
                {kind}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(pct * 100, 4)}%`, backgroundColor: KIND_COLORS[kind] },
                  ]}
                />
              </View>
              <Text style={styles.rowValue}>
                {count} 张 · {(pct * 100).toFixed(1)}%
              </Text>
            </View>
          );
        })}
        {selectedKind && (
          <Text style={styles.hint}>已筛选「{selectedKind}」的牌名分布,再点一次取消</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>按花色统计</Text>
      <View style={styles.card}>
        <View style={styles.suitGrid}>
          {SUIT_ORDER.map((suit) => (
            <View key={suit} style={styles.suitCell}>
              <Text style={[styles.suitIcon, { color: SUIT_COLORS[suit] }]}>{suit}</Text>
              <Text style={styles.suitCount}>{bySuit[suit]}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        牌名分布{selectedKind ? `(${selectedKind})` : ''}
      </Text>
      <View style={styles.card}>
        {shownNames.map(({ name, count }) => (
          <View key={name} style={styles.nameRow}>
            <Text style={styles.nameText}>{name}</Text>
            <View style={styles.nameDots}>
              {Array.from({ length: count }).map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
            <Text style={styles.nameCount}>×{count}</Text>
          </View>
        ))}
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
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: dark ? 0 : 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    bigNumber: { fontSize: 44, fontWeight: '800', color: '#c0392b' },
    bigLabel: { fontSize: 13, color: dark ? '#888' : '#777', marginTop: 4 },
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    rowLabel: { width: 64, fontSize: 15, color: dark ? '#ddd' : '#333' },
    rowLabelSelected: { fontWeight: '800', color: '#c0392b' },
    barTrack: {
      flex: 1,
      height: 10,
      borderRadius: 5,
      backgroundColor: dark ? '#333' : '#eee',
      marginHorizontal: 10,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 5 },
    rowValue: { width: 92, textAlign: 'right', fontSize: 13, color: dark ? '#aaa' : '#666' },
    hint: { marginTop: 8, fontSize: 12, color: '#8e44ad' },
    suitGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
    suitCell: { alignItems: 'center' },
    suitIcon: { fontSize: 30, fontWeight: '700' },
    suitCount: { marginTop: 4, fontSize: 15, fontWeight: '600', color: dark ? '#ddd' : '#333' },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: dark ? '#2c2c30' : '#eee',
    },
    nameText: { width: 92, fontSize: 14, color: dark ? '#ddd' : '#333' },
    nameDots: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c0392b' },
    nameCount: { width: 36, textAlign: 'right', fontSize: 13, color: dark ? '#888' : '#777' },
  });
