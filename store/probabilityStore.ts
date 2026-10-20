import { create } from 'zustand';
import { DECKS, STANDARD_DECK } from '@/data';
import type { CardKind, Suit } from '@/lib/cards';

/** 牌库选择 + 概率计算页输入的全局状态 */
interface AppState {
  /** 当前选用的牌库 id */
  deckId: string;
  /** 抽取张数 n */
  draws: number;
  /** 目标筛选:牌名(空字符串表示不按名称筛选) */
  targetName: string;
  /** 目标筛选:大类,null 表示不限 */
  targetKind: CardKind | null;
  /** 目标筛选:花色,null 表示不限 */
  targetSuit: Suit | null;
  setDeck: (id: string) => void;
  setDraws: (n: number) => void;
  setTargetName: (name: string) => void;
  setTargetKind: (kind: CardKind | null) => void;
  setTargetSuit: (suit: Suit | null) => void;
  reset: () => void;
}

const initialFilters = {
  targetName: '杀',
  targetKind: null,
  targetSuit: null,
} as const;

/** 牌库切换时重置筛选(牌名在新牌库里数量可能为 0) */
const initial = {
  deckId: STANDARD_DECK.id,
  draws: 4,
  ...initialFilters,
};

export const useAppStore = create<AppState>((set) => ({
  ...initial,
  setDeck: (deckId) => set({ deckId, ...initialFilters }),
  setDraws: (draws) => {
    const max = Math.max(...DECKS.map((d) => d.cards.length));
    set({ draws: Math.max(0, Math.min(max, Math.round(draws))) });
  },
  setTargetName: (targetName) => set({ targetName }),
  setTargetKind: (targetKind) => set({ targetKind }),
  setTargetSuit: (targetSuit) => set({ targetSuit }),
  reset: () => set({ ...initial }),
}));
