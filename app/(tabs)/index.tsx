import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { packsToDeck } from '@/lib/packs';
import { countByKind, countByName, countBySuit, filterCards } from '@/lib/cards';
import { suitColor, type CardDef, type CardKind, type Suit } from '@/lib/cards';
import { DeckSwitcher } from '@/components/DeckSwitcher';
import { hydratePackConfig, usePackConfig } from '@/store/packConfigStore';

const KIND_ORDER: CardKind[] = ['基本牌', '锦囊牌', '装备牌'];
const SUIT_ORDER: Suit[] = ['♠', '♥', '♣', '♦'];
/** 牌表列顺序与常见牌表一致:红桃、方块、梅花、黑桃 */
const CHART_SUITS: Suit[] = ['♥', '♦', '♣', '♠'];
const RANK_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

/** 同一点数拆成多行,每格最多一张牌名 */
function rankLines(slots: Map<string, string[]>, rank: string, suits: Suit[]): string[][] {
  const columns = suits.map((suit) => slots.get(`${rank}\0${suit}`) ?? []);
  const height = Math.max(1, ...columns.map((names) => names.length));
  return Array.from({ length: height }, (_, line) => columns.map((names) => names[line] ?? ''));
}

/** 按「点数 + 花色」归堆,保留牌库中的出现顺序 */
function cardsBySlot(cards: CardDef[]): Map<string, string[]> {
  const slots = new Map<string, string[]>();
  for (const card of cards) {
    const key = `${card.rank}\0${card.suit}`;
    const names = slots.get(key);
    if (names) names.push(card.name);
    else slots.set(key, [card.name]);
  }
  return slots;
}

const KIND_COLORS: Record<CardKind, string> = {
  基本牌: '#e74c3c',
  锦囊牌: '#8e44ad',
  装备牌: '#2980b9',
};

export default function DeckStatsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const styles = useMemo(() => createStyles(dark), [dark]);
  const router = useRouter();

  const { officialPacks, customPacks, activePackIds, hydrated, toggleActive } = usePackConfig();

  useEffect(() => {
    if (!hydrated) void hydratePackConfig();
  }, [hydrated]);

  const deck = useMemo(() => {
    const packs = [...officialPacks, ...customPacks].filter((p) => activePackIds.includes(p.id));
    return packsToDeck(packs);
  }, [officialPacks, customPacks, activePackIds]);

  const [filterKinds, setFilterKinds] = useState<CardKind[]>([]);
  const [filterSuits, setFilterSuits] = useState<Suit[]>([]);
  const [filterRanks, setFilterRanks] = useState<string[]>([]);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  const byKind = countByKind(deck.cards);
  const bySuit = countBySuit(deck.cards);
  const extraRanks = useMemo(() => {
    const known = new Set(RANK_ORDER);
    const extras = new Set<string>();
    for (const card of deck.cards) {
      if (!known.has(card.rank)) extras.add(card.rank);
    }
    return [...extras];
  }, [deck]);
  const chartRanks = extraRanks.length ? [...RANK_ORDER, ...extraRanks] : RANK_ORDER;
  const filteredCards = useMemo(
    () =>
      filterCards(deck.cards, {
        kinds: filterKinds,
        suits: filterSuits,
        ranks: filterRanks,
      }),
    [deck, filterKinds, filterSuits, filterRanks],
  );
  const shownNames = countByName(filteredCards);
  const filterActive = filterKinds.length + filterSuits.length + filterRanks.length > 0;
  const slots = useMemo(() => cardsBySlot(filteredCards), [filteredCards]);
  const visibleSuits = filterSuits.length ? CHART_SUITS.filter((suit) => filterSuits.includes(suit)) : CHART_SUITS;
  const visibleRanks = (filterRanks.length ? chartRanks.filter((rank) => filterRanks.includes(rank)) : chartRanks).filter(
    (rank) => !filterActive || visibleSuits.some((suit) => (slots.get(`${rank}\0${suit}`) ?? []).length > 0),
  );

  return (
    <View style={styles.container}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>牌库统计</Text>

      <Text style={styles.sectionTitle}>选择卡包(可多选合并)</Text>
      <View style={styles.card}>
        <DeckSwitcher
          official={officialPacks}
          custom={customPacks}
          activeId={activePackIds}
          onSelect={toggleActive}
          onEdit={(id) => router.push(`/pack/${id}`)}
          dark={dark}
        />
        <Text style={styles.deckDesc}>
          {deck.cards.length === 0 ? '未选择卡包,可全部取消' : deck.description}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>牌库总览</Text>
      <View style={styles.card}>
        <Text style={styles.bigNumber}>{deck.cards.length}</Text>
        <Text style={styles.bigLabel}>张游戏牌 · {deck.name}</Text>
      </View>

      <Text style={styles.sectionTitle}>按类型统计</Text>
      <View style={styles.card}>
        {KIND_ORDER.map((kind) => {
          const count = byKind[kind];
          if (count === 0) return null;
          const pct = deck.cards.length === 0 ? 0 : count / deck.cards.length;
          return (
            <View key={kind} style={styles.row}>
              <Text style={styles.rowLabel}>{kind}</Text>
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
      </View>

      <Text style={styles.sectionTitle}>按花色统计</Text>
      <View style={styles.card}>
        <View style={styles.suitGrid}>
          {SUIT_ORDER.map((suit) => (
            <View key={suit} style={styles.suitCell}>
              <Text style={[styles.suitIcon, { color: suitColor(suit, dark) }]}>{suit}</Text>
              <Text style={styles.suitCount}>{bySuit[suit]}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>牌名分布</Text>
      <View style={styles.card}>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>类别:</Text>
          {KIND_ORDER.map((kind) => (
            <Text
              key={kind}
              style={[styles.chip, filterKinds.includes(kind) && styles.chipActive]}
              onPress={() => setFilterKinds((current) => toggleItem(current, kind))}
            >
              {kind}
            </Text>
          ))}
        </View>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>花色:</Text>
          {SUIT_ORDER.map((suit) => {
            const active = filterSuits.includes(suit);
            return (
              <Text
                key={suit}
                style={[styles.chip, active && styles.chipActive, { color: active ? '#fff' : suitColor(suit, dark) }]}
                onPress={() => setFilterSuits((current) => toggleItem(current, suit))}
              >
                {suit}
              </Text>
            );
          })}
        </View>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>点数:</Text>
          {chartRanks.map((rank) => (
            <Text
              key={rank}
              style={[styles.chip, filterRanks.includes(rank) && styles.chipActive]}
              onPress={() => setFilterRanks((current) => toggleItem(current, rank))}
            >
              {rank}
            </Text>
          ))}
        </View>
        <View style={styles.filterActions}>
          <Text style={styles.pickBtn} onPress={() => setNameDialogOpen(true)}>
            牌名数量
          </Text>
          {filterActive && (
            <Text
              style={styles.clearLink}
              onPress={() => {
                setFilterKinds([]);
                setFilterSuits([]);
                setFilterRanks([]);
              }}
            >
              清除筛选 · 命中 {filteredCards.length} 张
            </Text>
          )}
        </View>
        <Text style={styles.chartTitle}>{deck.cards.length === 0 ? '牌表' : `${deck.name}牌表`}</Text>
        {deck.cards.length === 0 ? (
          <Text style={styles.emptyText}>未选择卡包</Text>
        ) : visibleRanks.length === 0 ? (
          <Text style={styles.emptyText}>没有符合条件的牌</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.rankCell} />
                {visibleSuits.map((suit) => (
                  <View key={suit} style={styles.suitHead}>
                    <Text style={[styles.suitHeadText, { color: suitColor(suit, dark) }]}>{suit}</Text>
                  </View>
                ))}
              </View>
              {visibleRanks.map((rank) => {
                const lines = rankLines(slots, rank, visibleSuits);
                return (
                  <View key={rank} style={styles.rankGroup}>
                    <View style={styles.rankCell}>
                      <Text style={styles.rankText}>{rank}</Text>
                    </View>
                    <View style={styles.rankLines}>
                      {lines.map((line, lineIndex) => (
                        <View key={lineIndex} style={styles.tableRow}>
                          {visibleSuits.map((suit, suitIndex) => (
                            <View key={suit} style={styles.slotCell}>
                              {line[suitIndex] ? (
                                <Text style={[styles.slotName, { color: suitColor(suit, dark) }]}>
                                  {line[suitIndex]}
                                </Text>
                              ) : null}
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </ScrollView>
    <Modal visible={nameDialogOpen} transparent animationType="fade" onRequestClose={() => setNameDialogOpen(false)}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropHit} onPress={() => setNameDialogOpen(false)} />
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>牌名数量</Text>
          <Text style={styles.dialogHint}>按当前筛选统计,共 {shownNames.length} 种 / {filteredCards.length} 张</Text>
          <ScrollView style={styles.dialogScroll}>
            <View style={styles.countTable}>
              <View style={styles.countHead}>
                <Text style={[styles.countHeadText, styles.countName]}>牌名</Text>
                <Text style={[styles.countHeadText, styles.countValue]}>数量</Text>
              </View>
              {shownNames.length === 0 ? (
                <Text style={styles.emptyText}>没有符合条件的牌</Text>
              ) : (
                shownNames.map(({ name, count }) => (
                  <View key={name} style={styles.countRow}>
                    <Text style={styles.countName}>{name}</Text>
                    <Text style={styles.countValue}>×{count}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
          <Text style={styles.cancelBtn} onPress={() => setNameDialogOpen(false)}>
            关闭
          </Text>
        </View>
      </View>
    </Modal>
    </View>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: dark ? '#111' : '#f5f5f7' },
    scroll: { flex: 1 },
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
    deckDesc: { marginTop: 10, fontSize: 12, color: dark ? '#888' : '#777' },
    bigNumber: { fontSize: 44, fontWeight: '800', color: '#c0392b' },
    bigLabel: { fontSize: 13, color: dark ? '#888' : '#777', marginTop: 4 },
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    rowLabel: { width: 64, fontSize: 15, color: dark ? '#ddd' : '#333' },
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
    chartTitle: {
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '700',
      color: '#2980b9',
      marginBottom: 10,
    },
    table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: dark ? '#555' : '#222', minWidth: 520 },
    tableRow: { flexDirection: 'row', alignItems: 'stretch' },
    rankGroup: { flexDirection: 'row', alignItems: 'stretch' },
    rankLines: {},
    rankCell: {
      width: 36,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: dark ? '#555' : '#222',
      backgroundColor: dark ? '#2a2a30' : '#f7f7f8',
    },
    rankText: { fontSize: 13, fontWeight: '700', color: dark ? '#ddd' : '#333' },
    suitHead: {
      width: 120,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: dark ? '#555' : '#222',
    },
    suitHeadText: { fontSize: 20, fontWeight: '700' },
    slotCell: {
      width: 120,
      minHeight: 32,
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: dark ? '#555' : '#222',
    },
    slotName: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
    emptyText: { fontSize: 13, color: dark ? '#888' : '#888', textAlign: 'center', paddingVertical: 8 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 },
    chipLabel: { fontSize: 13, color: dark ? '#888' : '#777', marginRight: 2 },
    chip: {
      fontSize: 13,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: dark ? '#2a2a30' : '#f0f0f2',
      color: dark ? '#ccc' : '#444',
    },
    chipActive: { backgroundColor: '#c0392b', color: '#fff', fontWeight: '700' },
    filterActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    pickBtn: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
      backgroundColor: '#c0392b',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
      overflow: 'hidden',
    },
    clearLink: { fontSize: 12, color: '#2980b9' },
    suitGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
    suitCell: { alignItems: 'center' },
    suitIcon: { fontSize: 30, fontWeight: '700' },
    suitCount: { marginTop: 4, fontSize: 15, fontWeight: '600', color: dark ? '#ddd' : '#333' },
    backdrop: { flex: 1, justifyContent: 'center', padding: 24 },
    backdropHit: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    dialog: {
      backgroundColor: dark ? '#1e1e22' : '#fff',
      borderRadius: 14,
      padding: 16,
      maxHeight: '80%',
    },
    dialogTitle: { fontSize: 18, fontWeight: '700', color: dark ? '#fff' : '#1c1c1e' },
    dialogHint: { fontSize: 12, color: dark ? '#888' : '#777', marginTop: 4, marginBottom: 10 },
    dialogScroll: { flexGrow: 0 },
    countTable: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: dark ? '#555' : '#222' },
    countHead: { flexDirection: 'row', backgroundColor: dark ? '#2a2a30' : '#f7f7f8' },
    countHeadText: { fontSize: 13, fontWeight: '700', color: dark ? '#ddd' : '#333' },
    countRow: { flexDirection: 'row' },
    countName: {
      flex: 1,
      fontSize: 14,
      color: dark ? '#eee' : '#222',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: dark ? '#555' : '#222',
    },
    countValue: {
      width: 72,
      fontSize: 14,
      fontWeight: '600',
      color: '#c0392b',
      textAlign: 'center',
      paddingVertical: 8,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: dark ? '#555' : '#222',
    },
    cancelBtn: { marginTop: 12, fontSize: 14, color: dark ? '#aaa' : '#666', alignSelf: 'flex-end' },
  });
