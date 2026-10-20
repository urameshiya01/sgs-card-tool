import type { DeckDefinition } from '@/lib/decks';
import { STANDARD_DECK } from './decks/standard';
import { JUNZHENG_DECK } from './decks/junzheng';
import { GUOZhan_DECK } from './decks/guozhan';

/** 全部可选牌库 */
export const DECKS: DeckDefinition[] = [STANDARD_DECK, JUNZHENG_DECK, GUOZhan_DECK];

export { STANDARD_DECK, JUNZHENG_DECK, GUOZhan_DECK };
