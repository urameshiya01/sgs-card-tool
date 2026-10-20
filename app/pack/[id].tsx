import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { countByKind, countBySuit, suitColor, type CardDef, type CardKind, type Suit } from '@/lib/cards';
import { confirmDialog, notify } from '@/lib/dialog';
import { packById, usePackConfig } from '@/store/packConfigStore';

const KINDS: CardKind[] = ['基本牌', '锦囊牌', '装备牌'];
const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];

interface FormState {
  name: string;
  kind: CardKind;
  suit: Suit;
  rank: string;
  description: string;
  count: string;
}

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const EMPTY_FORM: FormState = {
  name: '',
  kind: '基本牌',
  suit: '♠',
  rank: '',
  description: '',
  count: '1',
};

export default function PackEditScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const styles = useMemo(() => createStyles(dark), [dark]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const { officialPacks, customPacks, renamePack, removeCard, addCard, updateCard, importCards } =
    usePackConfig();
  const pack = packById(officialPacks, customPacks, id ?? '');

  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<CardDef | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [importFromId, setImportFromId] = useState<string | null>(null);
  const [pickedIds, setPickedIds] = useState<string[]>([]);

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

  const editable = !pack.official;
  const byKind = countByKind(pack.cards);
  const bySuit = countBySuit(pack.cards);
  const importSources = [...officialPacks, ...customPacks].filter((p) => p.id !== pack.id);
  const importSource = importSources.find((p) => p.id === importFromId);
  const shown = pack.cards.filter((c) => !query || c.name.includes(query) || (c.description ?? '').includes(query));

  const openEdit = (card: CardDef) => {
    setEditing(card);
    setEditForm({
      name: card.name,
      kind: card.kind,
      suit: card.suit,
      rank: card.rank === '—' ? '' : card.rank,
      description: card.description ?? '',
      count: '1',
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    const name = editForm.name.trim();
    if (!name) {
      notify('请填写牌名');
      return;
    }
    updateCard(pack.id, editing.id, {
      name,
      kind: editForm.kind,
      suit: editForm.suit,
      rank: editForm.rank.trim() || '—',
      description: editForm.description.trim() || undefined,
    });
    setEditing(null);
  };

  const submitForm = () => {
    const name = form.name.trim();
    if (!name) {
      notify('请填写牌名');
      return;
    }
    const count = Math.max(1, parseInt(form.count, 10) || 1);
    addCard(pack.id, { name, kind: form.kind, suit: form.suit, description: form.description.trim() || undefined }, count);
    setForm({ ...EMPTY_FORM, kind: form.kind, suit: form.suit });
  };

  const importAll = () => {
    if (!importSource) return;
    const added = importCards(pack.id, importSource.id);
    notify(added > 0 ? `已加入 ${added} 张` : '这些牌已经都在当前卡包里');
    setPickedIds([]);
  };

  const importPicked = () => {
    if (!importSource || pickedIds.length === 0) return;
    const added = importCards(pack.id, importSource.id, pickedIds);
    notify(added > 0 ? `已加入 ${added} 张` : '选中的牌已经都在当前卡包里');
    setPickedIds([]);
  };

  return (
    <View style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{pack.name}</Text>
      <Text style={styles.desc}>
        {pack.cards.length} 张 · {pack.composition}
        {editable ? '' : ' · 官方标准卡包不可修改'}
      </Text>

      {editable && (
        <TextInput
          style={styles.renameInput}
          defaultValue={pack.name}
          placeholder="重命名卡包,回车保存"
          placeholderTextColor={dark ? '#666' : '#aaa'}
          onSubmitEditing={(e) => renamePack(pack.id, e.nativeEvent.text)}
        />
      )}

      <Text style={styles.sectionTitle}>概览</Text>
      <View style={styles.card}>
        <Text style={styles.overviewLine}>
          类型:{KINDS.map((k) => `${k} ${byKind[k]}`).join(' · ')}
        </Text>
        <Text style={styles.overviewLine}>
          花色:♠{bySuit['♠']} ♥{bySuit['♥']} ♣{bySuit['♣']} ♦{bySuit['♦']}
        </Text>
      </View>

      {editable && (
        <>
          <Text style={styles.sectionTitle}>手动添加卡牌</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>牌名</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(name) => setForm((f) => ({ ...f, name }))}
              placeholder="如:杀、火杀、自定义牌"
              placeholderTextColor={dark ? '#666' : '#aaa'}
            />
            <Text style={styles.fieldLabel}>类型</Text>
            <View style={styles.chipRow}>
              {KINDS.map((kind) => (
                <Text
                  key={kind}
                  style={[styles.chip, form.kind === kind && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, kind }))}
                >
                  {kind}
                </Text>
              ))}
            </View>
            <Text style={styles.fieldLabel}>花色</Text>
            <View style={styles.chipRow}>
              {SUITS.map((suit) => {
                const active = form.suit === suit;
                return (
                  <Text
                    key={suit}
                    style={[
                      styles.chip,
                      active && styles.chipActive,
                      { color: active ? '#fff' : suitColor(suit, dark) },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, suit }))}
                  >
                    {suit}
                  </Text>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>描述</Text>
            <TextInput
              style={[styles.input, styles.descInput]}
              value={form.description}
              onChangeText={(description) => setForm((f) => ({ ...f, description }))}
              placeholder="可选,例如:雷属性杀"
              placeholderTextColor={dark ? '#666' : '#aaa'}
              multiline
            />
            <Text style={styles.fieldLabel}>数量</Text>
            <TextInput
              style={[styles.input, styles.countInput]}
              value={form.count}
              keyboardType="number-pad"
              onChangeText={(count) => setForm((f) => ({ ...f, count }))}
            />
            <View style={styles.formActions}>
              <Text style={styles.primaryBtn} onPress={submitForm}>
                添加
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>从卡包一键加入</Text>
          <View style={styles.card}>
            <Text style={styles.hint}>选一个卡包,可整包加入,或勾选其中若干张再加入。</Text>
            <View style={styles.chipRow}>
              {importSources.map((p) => (
                <Text
                  key={p.id}
                  style={[styles.chip, importFromId === p.id && styles.chipActive]}
                  onPress={() => {
                    setImportFromId(importFromId === p.id ? null : p.id);
                    setPickedIds([]);
                  }}
                >
                  {p.name}
                </Text>
              ))}
            </View>
            {importSource && (
              <>
                <Text style={styles.primaryBtn} onPress={importAll}>
                  一键加入全部({importSource.cards.length} 张)
                </Text>
                <Text style={styles.fieldLabel}>或勾选后加入</Text>
                <View style={styles.chipRow}>
                  {importSource.cards.map((c) => {
                    const picked = pickedIds.includes(c.id);
                    return (
                      <Text
                        key={c.id}
                        style={[styles.chip, picked && styles.chipActive]}
                        onPress={() =>
                          setPickedIds((ids) =>
                            picked ? ids.filter((x) => x !== c.id) : [...ids, c.id],
                          )
                        }
                      >
                        {picked ? '✓ ' : ''}
                        {c.name}{' '}
                        <Text style={{ color: picked ? '#fff' : suitColor(c.suit, dark) }}>{c.suit}</Text>
                        {c.rank === '—' ? '' : c.rank}
                      </Text>
                    );
                  })}
                </View>
                <Text
                  style={[styles.secondaryBtn, pickedIds.length === 0 && styles.btnDisabled]}
                  onPress={pickedIds.length ? importPicked : undefined}
                >
                  加入已选({pickedIds.length} 张)
                </Text>
              </>
            )}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>卡牌列表</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="搜索牌名或描述"
          placeholderTextColor={dark ? '#666' : '#aaa'}
        />
        {shown.length === 0 && <Text style={styles.hint}>没有卡牌</Text>}
        {shown.map((card) => (
          <View key={card.id} style={styles.cardRow}>
            <View style={styles.cardMain}>
              <Text style={styles.cardName}>
                {card.name}{' '}
                <Text style={{ color: suitColor(card.suit, dark), fontWeight: '700' }}>{card.suit}</Text>
                {card.rank === '—' ? '' : card.rank}
              </Text>
              <Text style={styles.cardMeta}>
                {card.kind}
                {card.description ? ` · ${card.description}` : ''}
              </Text>
            </View>
            {editable && (
              <View style={styles.rowActions}>
                <Pressable
                  hitSlop={8}
                  style={styles.actionBtn}
                  onPress={() => openEdit(card)}
                >
                  <Text style={styles.linkBtn}>修改</Text>
                </Pressable>
                <Pressable
                  hitSlop={8}
                  style={styles.actionBtn}
                  onPress={() => {
                    void confirmDialog('删除卡牌', `确定删除「${card.name}」?`).then((ok) => {
                      if (ok) removeCard(pack.id, card.id);
                    });
                  }}
                >
                  <Text style={[styles.linkBtn, styles.dangerBtn]}>删除</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
    <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropHit} onPress={() => setEditing(null)} />
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>修改卡牌</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.dialogScroll}>
            <Text style={styles.fieldLabel}>名称</Text>
            <TextInput
              style={styles.input}
              value={editForm.name}
              onChangeText={(name) => setEditForm((f) => ({ ...f, name }))}
              placeholder="牌名"
              placeholderTextColor={dark ? '#666' : '#aaa'}
            />
            <Text style={styles.fieldLabel}>点数</Text>
            <TextInput
              style={styles.input}
              value={editForm.rank}
              onChangeText={(rank) => setEditForm((f) => ({ ...f, rank }))}
              placeholder="如 A、10、J,留空表示无点数"
              placeholderTextColor={dark ? '#666' : '#aaa'}
            />
            <View style={styles.chipRow}>
              {RANKS.map((rank) => (
                <Text
                  key={rank}
                  style={[styles.chip, editForm.rank === rank && styles.chipActive]}
                  onPress={() => setEditForm((f) => ({ ...f, rank }))}
                >
                  {rank}
                </Text>
              ))}
            </View>
            <Text style={styles.fieldLabel}>类型</Text>
            <View style={styles.chipRow}>
              {KINDS.map((kind) => (
                <Text
                  key={kind}
                  style={[styles.chip, editForm.kind === kind && styles.chipActive]}
                  onPress={() => setEditForm((f) => ({ ...f, kind }))}
                >
                  {kind}
                </Text>
              ))}
            </View>
            <Text style={styles.fieldLabel}>花色</Text>
            <View style={styles.chipRow}>
              {SUITS.map((suit) => {
                const active = editForm.suit === suit;
                return (
                  <Text
                    key={suit}
                    style={[styles.chip, active && styles.chipActive, { color: active ? '#fff' : suitColor(suit, dark) }]}
                    onPress={() => setEditForm((f) => ({ ...f, suit }))}
                  >
                    {suit}
                  </Text>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>描述</Text>
            <TextInput
              style={[styles.input, styles.descInput]}
              value={editForm.description}
              onChangeText={(description) => setEditForm((f) => ({ ...f, description }))}
              placeholder="可选"
              placeholderTextColor={dark ? '#666' : '#aaa'}
              multiline
            />
          </ScrollView>
          <View style={styles.formActions}>
            <Text style={styles.primaryBtn} onPress={saveEdit}>
              保存
            </Text>
            <Text style={styles.cancelBtn} onPress={() => setEditing(null)}>
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
    content: { padding: 16, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '700', color: dark ? '#fff' : '#1c1c1e' },
    desc: { fontSize: 13, color: dark ? '#888' : '#777', marginTop: 4 },
    renameInput: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: dark ? '#3a3a40' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: dark ? '#eee' : '#222',
    },
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
    fieldLabel: { fontSize: 13, color: dark ? '#888' : '#777', marginTop: 10, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: dark ? '#3a3a40' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: dark ? '#eee' : '#222',
    },
    descInput: { minHeight: 64, textAlignVertical: 'top' },
    countInput: { width: 72 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    formActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 },
    primaryBtn: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
      backgroundColor: '#c0392b',
      borderRadius: 10,
      paddingVertical: 11,
      paddingHorizontal: 16,
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
      marginTop: 12,
    },
    btnDisabled: { opacity: 0.4 },
    cancelBtn: { fontSize: 14, color: dark ? '#888' : '#666', marginTop: 12 },
    hint: { fontSize: 12, color: dark ? '#888' : '#777', marginBottom: 8 },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: dark ? '#2c2c30' : '#eee',
    },
    cardMain: { flex: 1 },
    cardName: { fontSize: 14, color: dark ? '#eee' : '#222' },
    cardMeta: { fontSize: 12, color: dark ? '#888' : '#777', marginTop: 2 },
    rowActions: { flexDirection: 'row', gap: 4 },
    actionBtn: { paddingHorizontal: 8, paddingVertical: 6 },
    linkBtn: { fontSize: 13, color: '#2980b9' },
    dangerBtn: { color: '#c0392b' },
    backdrop: { flex: 1, justifyContent: 'center', padding: 20 },
    backdropHit: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    dialog: {
      backgroundColor: dark ? '#1e1e22' : '#fff',
      borderRadius: 14,
      padding: 16,
      maxHeight: '86%',
    },
    dialogTitle: { fontSize: 18, fontWeight: '700', color: dark ? '#fff' : '#1c1c1e', marginBottom: 4 },
    dialogScroll: { flexGrow: 0 },
    empty: { textAlign: 'center', marginTop: 80, fontSize: 15, color: '#888' },
    backLink: { textAlign: 'center', marginTop: 16, fontSize: 14, color: '#2980b9' },
  });
