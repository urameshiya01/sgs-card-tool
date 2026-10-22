import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { countByName, filterCards } from '@/lib/cards';
import { suitColor, type CardKind, type Suit } from '@/lib/cards';
import { packsToDeck } from '@/lib/packs';
import {
  formatPercentSmart,
  hypergeometricAtLeast,
  hypergeometricMean,
  hypergeometricPMF,
} from '@/lib/probability';
import { DeckSwitcher } from '@/components/DeckSwitcher';
import { usePackConfig } from '@/store/packConfigStore';

const KINDS: CardKind[] = ['基本牌', '锦囊牌', '装备牌'];
const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const DRAW_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 张数输入:删空一位数时回到 0;当前是 0 时再输入数字则替换掉这个 0 */
function nextDrawText(previous: string, raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return '0';
  if (previous !== '0') return digits.replace(/^0+(?=\d)/, '') || '0';
  if (digits.length === 1) return digits;
  if (digits.length === 2) {
    if (digits[0] === '0') return digits[1];
    if (digits[1] === '0') return digits[0];
    return digits;
  }
  return digits.replace(/^0+/, '') || '0';
}

export default function ProbabilityScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const styles = useMemo(() => createStyles(dark), [dark]);

  const {
    officialPacks,
    customPacks,
    activePackIds,
    toggleActive,
    draws,
    targetNames,
    targetKinds,
    targetSuits,
    targetRanks,
    setDraws,
    setTargetNames,
    toggleTargetKind,
    toggleTargetSuit,
    toggleTargetRank,
    resetFilters: reset,
  } = usePackConfig();
  const {
    deckFilterNames,
    deckFilterKinds,
    deckFilterSuits,
    deckFilterRanks,
    setDeckFilterNames,
    toggleDeckFilterKind,
    toggleDeckFilterSuit,
    toggleDeckFilterRank,
    clearDeckFilter,
  } = usePackConfig();

  const fullDeck = useMemo(() => {
    const packs = [...officialPacks, ...customPacks].filter((p) => activePackIds.includes(p.id));
    return packsToDeck(packs);
  }, [officialPacks, customPacks, activePackIds]);

  /** 牌堆筛选后用于计算的牌库(默认不筛选 = 全牌库) */
  const deck = useMemo(
    () =>
      filterCards(fullDeck.cards, {
        names: deckFilterNames,
        kinds: deckFilterKinds,
        suits: deckFilterSuits,
        ranks: deckFilterRanks,
      }),
    [fullDeck, deckFilterNames, deckFilterKinds, deckFilterSuits, deckFilterRanks],
  );
  const deckFiltered =
    deckFilterNames.length > 0 ||
    deckFilterKinds.length > 0 ||
    deckFilterSuits.length > 0 ||
    deckFilterRanks.length > 0;
  const total = deck.length;
  const [drawText, setDrawText] = useState(String(draws));
  const [drawFocused, setDrawFocused] = useState(false);
  const [cardQuery, setCardQuery] = useState('');
  /** 当前打开的牌名弹窗用途:target = 目标牌,deck = 牌堆筛选 */
  const [pickerMode, setPickerMode] = useState<'target' | 'deck'>('target');
  const [namePickerOpen, setNamePickerOpen] = useState(false);
  const [draftNames, setDraftNames] = useState<string[]>([]);

  useEffect(() => {
    setDrawText(String(draws));
  }, [draws]);
  const [searchMode, setSearchMode] = useState<'fuzzy' | 'exact'>('fuzzy');

  /** 当前牌库里的全部牌名,按数量从多到少 */
  const allNames = useMemo(() => countByName(deck), [deck]);
  const pickerNames = useMemo(() => {
    const q = cardQuery.trim();
    if (!q) return allNames;
    return allNames.filter(({ name }) => (searchMode === 'exact' ? name === q : name.includes(q)));
  }, [allNames, cardQuery, searchMode]);

  const openNamePicker = (mode: 'target' | 'deck') => {
    setPickerMode(mode);
    setDraftNames(mode === 'target' ? targetNames : deckFilterNames);
    setCardQuery('');
    setNamePickerOpen(true);
  };
  const toggleDraftName = (name: string) => {
    setDraftNames((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  };
  const confirmNames = () => {
    if (pickerMode === 'target') setTargetNames(draftNames);
    else setDeckFilterNames(draftNames);
    setNamePickerOpen(false);
  };

  const targetCards = useMemo(
    () =>
      filterCards(deck, {
        names: targetNames,
        kinds: targetKinds,
        suits: targetSuits,
        ranks: targetRanks,
      }),
    [deck, targetNames, targetKinds, targetSuits, targetRanks],
  );
  const targetCount = targetCards.length;

  const result = useMemo(() => {
    if (draws > total) return null;
    if (targetCount === 0 && total > 0) return null;
    const atLeast1 = hypergeometricAtLeast(total, targetCount, draws, 1);
    const distribution = Array.from({ length: Math.min(draws, targetCount) + 1 }, (_, m) => ({
      hits: m,
      pmf: hypergeometricPMF(total, targetCount, draws, m),
    }));
    const mean = hypergeometricMean(total, targetCount, draws);
    return { atLeast1, distribution, mean };
  }, [total, targetCount, draws]);

  return (
    <View style={styles.container}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>概率计算</Text>

      <Text style={styles.sectionTitle}>0. 选择卡包(可多选合并)</Text>
      <View style={styles.card}>
        <DeckSwitcher
          official={officialPacks}
          custom={customPacks}
          activeId={activePackIds}
          onSelect={toggleActive}
          dark={dark}
        />
        <Text style={styles.deckDesc}>
          {fullDeck.cards.length === 0
            ? '未选择卡包,可以全部取消'
            : `当前牌库:${fullDeck.description}`}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>1. 筛选牌堆(可选,默认不筛选)</Text>
      <View style={styles.card}>
        <View style={styles.deckFilterHeader}>
          <Text style={styles.pickBtn} onPress={() => openNamePicker('deck')}>
            选择牌名
          </Text>
          {deckFiltered ? (
            <Text style={styles.clearLink} onPress={clearDeckFilter}>
              清除筛选
            </Text>
          ) : (
            <Text style={styles.deckFilterOff}>未筛选,使用全部牌堆</Text>
          )}
        </View>
        {deckFiltered ? (
          <Text style={styles.pickedNames}>
            {deckFilterNames.length ? deckFilterNames.join('、') : '不限牌名'}
          </Text>
        ) : null}
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>类型:</Text>
          {KINDS.map((kind) => (
            <Text
              key={kind}
              style={[styles.chip, deckFilterKinds.includes(kind) && styles.chipActive]}
              onPress={() => toggleDeckFilterKind(kind)}
            >
              {kind}
            </Text>
          ))}
        </View>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>花色:</Text>
          {SUITS.map((suit) => {
            const active = deckFilterSuits.includes(suit);
            return (
              <Text
                key={suit}
                style={[styles.chip, active && styles.chipActive, { color: active ? '#fff' : suitColor(suit, dark) }]}
                onPress={() => toggleDeckFilterSuit(suit)}
              >
                {suit}
              </Text>
            );
          })}
        </View>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>点数:</Text>
          {RANKS.map((rank) => (
            <Text
              key={rank}
              style={[styles.chip, deckFilterRanks.includes(rank) && styles.chipActive]}
              onPress={() => toggleDeckFilterRank(rank)}
            >
              {rank}
            </Text>
          ))}
        </View>
        <Text style={styles.targetSummary}>
          筛选后牌堆:
          <Text style={styles.targetCount}>
            {deck.length} 张
          </Text>
          {` / 全部 ${fullDeck.cards.length} 张`}
          {deckFiltered
            ? `(${[deckFilterNames, deckFilterKinds].map((list) => list.join('、')).filter(Boolean).join(' · ')}` +
              `${deckFilterSuits.length ? ' · ' : ''}` +
              deckFilterSuits.join('') +
              `${deckFilterRanks.length ? ' · ' : ''}` +
              `${deckFilterRanks.join('、')})`
            : ''}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>2. 选择目标牌(可叠加筛选)</Text>
      <View style={styles.card}>
        <Text style={styles.pickBtn} onPress={() => openNamePicker('target')}>
          选择牌名
        </Text>
        <Text style={styles.pickedNames}>
          {targetNames.length ? targetNames.join('、') : '未限定牌名'}
        </Text>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>类型:</Text>
          {KINDS.map((kind) => (
            <Text
              key={kind}
              style={[styles.chip, targetKinds.includes(kind) && styles.chipActive]}
              onPress={() => toggleTargetKind(kind)}
            >
              {kind}
            </Text>
          ))}
        </View>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>花色:</Text>
          {SUITS.map((suit) => {
            const active = targetSuits.includes(suit);
            return (
              <Text
                key={suit}
                style={[styles.chip, active && styles.chipActive, { color: active ? '#fff' : suitColor(suit, dark) }]}
                onPress={() => toggleTargetSuit(suit)}
              >
                {suit}
              </Text>
            );
          })}
        </View>
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel}>点数:</Text>
          {RANKS.map((rank) => (
            <Text
              key={rank}
              style={[styles.chip, targetRanks.includes(rank) && styles.chipActive]}
              onPress={() => toggleTargetRank(rank)}
            >
              {rank}
            </Text>
          ))}
        </View>
        <Text style={styles.targetSummary}>
          命中目标:
          <Text style={styles.targetCount}>
            {targetNames.length ? targetNames.join('、') : '任意牌名'}
          </Text>
          {targetKinds.length ? ` · ${targetKinds.join('、')}` : ''}
          {targetSuits.length ? ' · ' : ''}
          {targetSuits.map((suit) => (
            <Text key={suit} style={{ color: suitColor(suit, dark) }}>
              {suit}
            </Text>
          ))}
          {targetRanks.length ? ` · ${targetRanks.join('、')}` : ''}
          {` = ${targetCount} 张 / 共 ${total} 张`}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>3. 抽取张数 n</Text>
      <View style={styles.card}>
        <View style={styles.chipRow}>
          {DRAW_STEPS.map((n) => (
            <Text key={n} style={[styles.chip, draws === n && styles.chipActive]} onPress={() => setDraws(n)}>
              {n}
            </Text>
          ))}
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.chipLabel}>张数:</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={drawText}
            selectTextOnFocus={drawText === '0'}
            selection={drawFocused && drawText === '0' ? { start: 0, end: 1 } : undefined}
            onFocus={() => setDrawFocused(true)}
            onBlur={() => setDrawFocused(false)}
            onChangeText={(text) => {
              const next = nextDrawText(drawText, text);
              setDrawText(next);
              setDraws(Number(next));
            }}
          />
          <Text style={styles.resetLink} onPress={reset}>
            重置
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>4. 计算结果</Text>
      {result ? (
        <View style={styles.card}>
          <View style={styles.heroResult}>
            <Text style={styles.heroPercent}>{formatPercentSmart(result.atLeast1)}</Text>
            <Text style={styles.heroLabel}>
              从 {deckFiltered ? `筛选后牌堆(${total} 张)` : fullDeck.name}抽 {draws} 张,至少 1 张目标牌的概率
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
            {draws > total
              ? `抽取 ${draws} 张超过当前牌库 ${total} 张。牌库为 0 张时,把抽取张数设为 0 即可计算。`
              : '当前筛选没有命中任何牌,请调整目标条件'}
          </Text>
        </View>
      )}
    </ScrollView>
    <Modal visible={namePickerOpen} transparent animationType="fade" onRequestClose={() => setNamePickerOpen(false)}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropHit} onPress={() => setNamePickerOpen(false)} />
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{pickerMode === 'deck' ? '筛选牌堆 · 选择牌名' : '选择牌名'}</Text>
          <Text style={styles.dialogHint}>
            {pickerMode === 'deck'
              ? '选中的牌名将用于缩小牌堆,可多选'
              : '可多选,点确认后才会用于计算'}
          </Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={cardQuery}
              onChangeText={setCardQuery}
              placeholder={searchMode === 'fuzzy' ? '模糊搜索牌名,如「无」' : '精准搜索牌名,如「杀」'}
              placeholderTextColor={dark ? '#666' : '#aaa'}
            />
            <Text
              style={[styles.modeBtn, searchMode === 'fuzzy' && styles.modeBtnActive]}
              onPress={() => setSearchMode('fuzzy')}
            >
              模糊
            </Text>
            <Text
              style={[styles.modeBtn, searchMode === 'exact' && styles.modeBtnActive]}
              onPress={() => setSearchMode('exact')}
            >
              精准
            </Text>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.dialogScroll}>
            {allNames.length === 0 ? (
              <Text style={styles.searchEmpty}>当前牌库没有牌</Text>
            ) : pickerNames.length === 0 ? (
              <Text style={styles.searchEmpty}>
                牌库里没有{searchMode === 'exact' ? '完全叫' : '包含'}「{cardQuery.trim()}」的牌
              </Text>
            ) : (
              <View style={styles.chipRow}>
                {pickerNames.map(({ name, count }) => (
                  <Text
                    key={name}
                    style={[styles.chip, draftNames.includes(name) && styles.chipActive]}
                    onPress={() => toggleDraftName(name)}
                  >
                    {name} ×{count}
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>
          <Text style={styles.dialogHint}>已选 {draftNames.length} 种{draftNames.length ? `: ${draftNames.join('、')}` : ''}</Text>
          <View style={styles.dialogActions}>
            <Text style={styles.confirmBtn} onPress={confirmNames}>
              确认
            </Text>
            <Text style={styles.cancelBtn} onPress={() => setNamePickerOpen(false)}>
              取消
            </Text>
          </View>
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
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: dark ? '#3a3a40' : '#ddd',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      fontSize: 14,
      color: dark ? '#eee' : '#222',
    },
    modeBtn: {
      fontSize: 13,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: dark ? '#2a2a30' : '#f0f0f2',
      color: dark ? '#ccc' : '#444',
    },
    modeBtnActive: { backgroundColor: '#c0392b', color: '#fff', fontWeight: '700' },
    searchEmpty: { fontSize: 13, color: dark ? '#888' : '#888' },
    pickBtn: {
      alignSelf: 'flex-start',
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
      backgroundColor: '#c0392b',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
      overflow: 'hidden',
      marginBottom: 8,
    },
    pickedNames: { fontSize: 13, color: dark ? '#ccc' : '#444', marginBottom: 12, lineHeight: 20 },
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
    deckFilterHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    deckFilterOff: { fontSize: 13, color: dark ? '#888' : '#777' },
    clearLink: { fontSize: 14, color: '#2980b9' },
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
    backdrop: { flex: 1, justifyContent: 'center', padding: 20 },
    backdropHit: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    dialog: {
      backgroundColor: dark ? '#1e1e22' : '#fff',
      borderRadius: 14,
      padding: 16,
      maxHeight: '86%',
    },
    dialogTitle: { fontSize: 18, fontWeight: '700', color: dark ? '#fff' : '#1c1c1e' },
    dialogHint: { fontSize: 12, color: dark ? '#888' : '#777', marginTop: 4, marginBottom: 10, lineHeight: 18 },
    dialogScroll: { maxHeight: 360 },
    dialogActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
    confirmBtn: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
      backgroundColor: '#c0392b',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 18,
      overflow: 'hidden',
    },
    cancelBtn: { fontSize: 14, color: dark ? '#aaa' : '#666' },
  });
