import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * 卡包选择器:横排胶囊,支持多选激活。
 * 官方卡包显示 🔒 角标,自定义卡包显示 ✎ 可点击进入编辑。
 */
export function DeckSwitcher({
  decks,
  activeId,
  onSelect,
  onEdit,
  multi,
  dark,
}: {
  decks: Array<{ id: string; name: string; official?: boolean }>;
  activeId: string | string[];
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  multi?: boolean;
  dark: boolean;
}) {
  const styles = createStyles(dark);
  const actives = Array.isArray(activeId) ? activeId : [activeId];

  return (
    <View style={styles.row}>
      {decks.map((deck) => {
        const active = actives.includes(deck.id);
        return (
          <View key={deck.id} style={styles.itemWrap}>
            <Pressable
              onPress={() => onSelect(deck.id)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Text style={[styles.itemText, active && styles.itemTextActive]}>
                {multi && active ? '✓ ' : ''}
                {deck.name}
                {deck.official ? ' 🔒' : ''}
              </Text>
            </Pressable>
            {onEdit && !deck.official && (
              <Text style={styles.editLink} onPress={() => onEdit(deck.id)}>
                ✎
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  });
