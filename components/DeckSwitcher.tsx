import { Pressable, StyleSheet, Text, View } from 'react-native';

type PackChip = { id: string; name: string; official?: boolean };

/**
 * 卡包选择器:分「默认卡包 / 自定义卡包」两行,支持多选,允许全部取消。
 */
export function DeckSwitcher({
  official,
  custom,
  activeId,
  onSelect,
  onEdit,
  dark,
}: {
  official: PackChip[];
  custom: PackChip[];
  activeId: string[];
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  dark: boolean;
}) {
  const styles = createStyles(dark);

  const renderChips = (decks: PackChip[], editable: boolean) =>
    decks.length === 0 ? (
      <Text style={styles.empty}>暂无</Text>
    ) : (
      decks.map((deck) => {
        const active = activeId.includes(deck.id);
        return (
          <View key={deck.id} style={styles.itemWrap}>
            <Pressable
              onPress={() => onSelect(deck.id)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Text style={[styles.itemText, active && styles.itemTextActive]}>
                {active ? '✓ ' : ''}
                {deck.name}
              </Text>
            </Pressable>
            {editable && onEdit && (
              <Text style={styles.editLink} onPress={() => onEdit(deck.id)}>
                ✎
              </Text>
            )}
          </View>
        );
      })
    );

  return (
    <View style={styles.wrap}>
      <View style={styles.line}>
        <Text style={styles.label}>默认卡包：</Text>
        <View style={styles.row}>{renderChips(official, false)}</View>
      </View>
      <View style={styles.line}>
        <Text style={styles.label}>自定义卡包：</Text>
        <View style={styles.row}>{renderChips(custom, true)}</View>
      </View>
    </View>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    wrap: { gap: 12 },
    line: { gap: 6 },
    label: { fontSize: 13, fontWeight: '600', color: dark ? '#aaa' : '#666' },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
    itemWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    item: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: dark ? '#2a2a30' : '#f0f0f2',
    },
    itemActive: { backgroundColor: '#c0392b' },
    itemText: { fontSize: 14, color: dark ? '#ccc' : '#444' },
    itemTextActive: { color: '#fff', fontWeight: '700' },
    editLink: { fontSize: 13, color: '#2980b9', paddingHorizontal: 4 },
    empty: { fontSize: 13, color: dark ? '#666' : '#999' },
  });
