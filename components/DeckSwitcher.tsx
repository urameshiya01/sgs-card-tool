import { Pressable, StyleSheet, Text, View } from 'react-native';

/** 牌库切换器:横排胶囊单选 */
export function DeckSwitcher({
  decks,
  activeId,
  onSelect,
  dark,
}: {
  decks: Array<{ id: string; name: string }>;
  activeId: string;
  onSelect: (id: string) => void;
  dark: boolean;
}) {
  const styles = createStyles(dark);
  return (
    <View style={styles.row}>
      {decks.map((deck) => {
        const active = deck.id === activeId;
        return (
          <Pressable
            key={deck.id}
            onPress={() => onSelect(deck.id)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text style={[styles.itemText, active && styles.itemTextActive]}>{deck.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    item: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: dark ? '#2a2a30' : '#f0f0f2',
    },
    itemActive: { backgroundColor: '#c0392b' },
    itemText: { fontSize: 14, color: dark ? '#ccc' : '#444' },
    itemTextActive: { color: '#fff', fontWeight: '700' },
  });
