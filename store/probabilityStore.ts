import { create } from 'zustand';
import { DECK, DECK_SIZE } from '@/data/sgsDeck';
import type { CardKind, Suit } from '@/lib/cards';

/** 概率计算页的输入状态 */
interface ProbabilityState {
  /** 抽取张数 n */
  draws: number;
  /** 目标筛选:牌名(空字符串表示不按名称筛选) */
  targetName: string;
  /** 目标筛选:大类,null 表示不限 */
  targetKind: CardKind | null;
  /** 目标筛选:花色,null 表示不限 */
  targetSuit: Suit | null;
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

export const useProbabilityStore = create<ProbabilityState>((set) => ({
  draws: 4,
  ...initialFilters,
  setDraws: (draws) => set({ draws: Math.max(0, Math.min(DECK_SIZE, Math.round(draws))) }),
  setTargetName: (targetName) => set({ targetName }),
  setTargetKind: (targetKind) => set({ targetKind }),
  setTargetSuit: (targetSuit) => set({ targetSuit }),
  reset: () => set({ draws: 4, ...initialFilters }),
}));
