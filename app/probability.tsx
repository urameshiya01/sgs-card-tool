import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { DECKS } from '@/data';
import { getDeck } from '@/lib/decks';
import { filterCards, countByName } from '@/lib/cards';
import type { CardKind, Suit } from '@/lib/cards';
import {
  formatPercentSmart,
  hypergeometricAtLeast,
  hypergeometricMean,
  hypergeometricPMF,
} from '@/lib/probability';
import { DeckSwitcher } from '@/components/DeckSwitcher';
import { useAppStore } from '@/store/probabilityStore';

const KINDS: CardKind[] = ['基本牌', '锦囊牌', '装备牌'];
const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];
const DRAW_STEPS = [1, 2, 3, 4, 5, 6, 8, 10];

export default function ProbabilityScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const styles = useMemo(() => createStyles(dark), [dark]);

  const {
    deckId,
    draws,
    targetName,
    targetKind,
    targetSuit,
    setDeck,
    setDraws,
    setTargetName,
    setTargetKind,
    setTargetSuit,
    reset,
  } = useAppStore();

  const deck = getDeck(DECKS, deckId);
  const total = deck.cards.length;

  /** 牌名快捷 chips:当前牌库里数量最多的前 6 种牌 */
  const quickNames = useMemo(() => countByName(deck.cards).slice(0, 6).map((e) => e.name), [deck]);

  /** 当前输入的牌名不在快捷列表里时,补一个自定义 chip */
  const extraNames = useMemo(
    () => (targetName && !quickNames.includes(targetName) ? [targetName] : []),
    [targetName, quickNames],
  );

  const targetCards = useMemo(
    () =>
      filterCards(deck.cards, {
        name: targetName || undefined,
        kind: targetKind ?? undefined,
        suit: targetSuit ?? undefined,
      }),
    [deck, targetName, targetKind, targetSuit],
  );
  const targetCount = targetCards.length;

  const result = useMemo(() => {
    if (targetCount === 0 || draws === 0) return null;
    const atLeast1 = hypergeometricAtLeast(total, targetCount, draws, 1);
    const distribution = Array.from({ length: Math.min(draws, targetCount) + 1 }, (_, m) => ({
      hits: m,
      pmf: hypergeometricPMF(total, targetCount, draws, m),
    }));
    const mean = hypergeometricMean(total, targetCount, draws);
    return { atLeast1, distribution, mean };
  }, [total, targetCount, draws]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>概率计算</Text>

      <Text style={styles.sectionTitle}>0. 选择牌库</Text>
      <View style={styles.card}>
        <DeckSwitcher decks={DECKS} activeId={deck.id} onSelect={setDeck} dark={dark} />
        <Text style={styles.deckDesc}>
          {deck.description} · 切换牌库会重置筛选条件
        </Text>
      </View>

      <Text style={styles.sectionTitle}>1. 选择目标牌(可叠加筛选)</Text>
      <View style={styles.card}>
        <View style={styles.chipRow}>
          {[...quickNames, ...extraNames].map((name) => (
            <Text
              key={name}
              style={[styles.chip, targetName === name && styles.chipActive]}
              onPress={() => setTargetName(targetName === name ? '' : name)}
            >
              {name}
            </Text>
          ))}
        </View>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>类型:</Text>
          {KINDS.map((kind) => (
            <Text
              key={kind}
              style={[styles.chip, targetKind === kind && styles.chipActive]}
              onPress={() => setTargetKind(targetKind === kind ? null : kind)}
            >
              {kind}
            </Text>
          ))}
        </View>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>花色:</Text>
          {SUITS.map((suit) => (
            <Text
              key={suit}
              style={[styles.chip, targetSuit === suit && styles.chipActive]}
              onPress={() => setTargetSuit(targetSuit === suit ? null : suit)}
            >
              {suit}
            </Text>
          ))}
        </View>
        <Text style={styles.targetSummary}>
          命中目标:<Text style={styles.targetCount}>{targetName || '任意牌名'}</Text>
          {targetKind ? ` · ${targetKind}` : ''}
          {targetSuit ? ` · ${targetSuit}` : ''} = {targetCount} 张 / 共 {total} 张
        </Text>
      </View>

      <Text style={styles.sectionTitle}>2. 抽取张数 n</Text>
      <View style={styles.card}>
        <View style={styles.chipRow}>
          {DRAW_STEPS.filter((n) => n <= total).map((n) => (
            <Text key={n} style={[styles.chip, draws === n && styles.chipActive]} onPress={() => setDraws(n)}>
              {n}
            </Text>
          ))}
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.chipLabel}>微调:</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(draws)}
            onChangeText={(text) => {
              const n = parseInt(text, 10);
              if (!Number.isNaN(n)) setDraws(n);
            }}
          />
          <Text style={styles.resetLink} onPress={reset}>
            重置
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>3. 计算结果</Text>
      {result ? (
        <View style={styles.card}>
          <View style={styles.heroResult}>
            <Text style={styles.heroPercent}>{formatPercentSmart(result.atLeast1)}</Text>
            <Text style={styles.heroLabel}>
              从 {deck.name}抽 {draws} 张,至少 1 张目标牌的概率
            </Text>
          </View>
          <Text style={styles.expectLine}>期望命中 {result.mean.toFixed(2)} 张</Text>

          <Text style={styles.distTitle}>命中张数分布 P(X = m)</Text>
          {result.distribution.map(({ hits, pmf }) => (
            <View key={hits} style={styles.distRow}>
              <Text style={styles.distLabel}>恰好 {hits} 张</Text>
              <View style={styles.distTrack}>
                <View style={[styles.distFill, { width: `${Math.max(pmf * 100, 1.5)}%` }]} />
              </View>
              <Text style={styles.distValue}>{formatPercentSmart(pmf)}</Text>
            </View>
          ))}
          <Text style={styles.formulaNote}>
            模型:超几何分布 P(X=m) = C(K,m)·C(N−K,n−m) / C(N,n),N={total},K={targetCount},n={draws}
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.emptyText}>
            {targetCount === 0 ? '当前筛选没有命中任何牌,请调整目标条件' : '请先选择抽取张数'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: dark ? '#111' : '#f5f5f7' },
    content: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 22, fontWeight: '700', color: dark ? '#fff' : '#1c1c1e' },
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
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: dark ? 0 : 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    deckDesc: { marginTop: 10, fontSize: 12, color: dark ? '#888' : '#777' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 4 },
    chipLabel: { fontSize: 13, color: dark ? '#888' : '#777', marginRight: 2 },
    chip: {
      fontSize: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: dark ? '#2a2a30' : '#f0f0f2',
      color: dark ? '#ccc' : '#444',
    },
    chipActive: { backgroundColor: '#c0392b', color: '#fff', fontWeight: '700' },
    targetSummary: { marginTop: 12, fontSize: 13, color: dark ? '#aaa' : '#666' },
    targetCount: { fontWeight: '700', color: '#c0392b' },
    sliderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    input: {
      width: 64,
      borderWidth: 1,
      borderColor: dark ? '#3a3a40' : '#ddd',
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      fontSize: 15,
      color: dark ? '#eee' : '#222',
      textAlign: 'center',
    },
    resetLink: { marginLeft: 'auto', fontSize: 14, color: '#2980b9' },
    heroResult: { alignItems: 'center', marginVertical: 8 },
    heroPercent: { fontSize: 40, fontWeight: '800', color: '#c0392b' },
    heroLabel: { fontSize: 13, color: dark ? '#888' : '#777', marginTop: 4, textAlign: 'center' },
    expectLine: { textAlign: 'center', fontSize: 13, color: dark ? '#aaa' : '#666', marginBottom: 8 },
    distTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: dark ? '#ccc' : '#555',
      marginTop: 12,
      marginBottom: 6,
    },
    distRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
    distLabel: { width: 76, fontSize: 13, color: dark ? '#ccc' : '#444' },
    distTrack: {
      flex: 1,
      height: 12,
      borderRadius: 6,
      backgroundColor: dark ? '#2c2c30' : '#f0f0f2',
      marginHorizontal: 8,
      overflow: 'hidden',
    },
    distFill: { height: '100%', borderRadius: 6, backgroundColor: '#2980b9' },
    distValue: { width: 72, textAlign: 'right', fontSize: 12, color: dark ? '#aaa' : '#666' },
    formulaNote: { marginTop: 12, fontSize: 11, color: dark ? '#666' : '#999', lineHeight: 16 },
    emptyText: { fontSize: 14, color: dark ? '#888' : '#777', textAlign: 'center', paddingVertical: 8 },
  });
