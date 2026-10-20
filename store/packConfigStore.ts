import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardDef, CardKind, Suit } from '@/lib/cards';
import type { CardPack, DeckDefinition } from '@/lib/packs';
import { packsToDeck } from '@/lib/packs';
import { OFFICIAL_PACKS, buildDefaultCustomPacks } from '@/data/officialPacks';

const STORAGE_KEY = '@sgs-card-tool/custom-packs-v1';
const ACTIVE_KEY = '@sgs-card-tool/active-pack-ids-v1';

export interface PackConfigState {
  /** 官方标准卡包(只读) */
  officialPacks: CardPack[];
  /** 自定义卡包(含两个默认合并包,可编辑/删除) */
  customPacks: CardPack[];
  /** 当前激活的卡包 id 列表(用于统计/概率页) */
  activePackIds: string[];
  /** 是否已从磁盘恢复 */
  hydrated: boolean;
  /** 由激活卡包合成的牌库视图 */
  activeDeck: DeckDefinition;
  /** 抽取张数 n(概率页) */
  draws: number;
  /** 目标筛选:牌名 */
  targetName: string;
  /** 目标筛选:大类,null 表示不限 */
  targetKind: CardKind | null;
  /** 目标筛选:花色,null 表示不限 */
  targetSuit: Suit | null;

  createPack: (name: string, sourcePackIds: string[]) => string | null;
  renamePack: (id: string, name: string) => void;
  deletePack: (id: string) => void;
  removeCard: (packId: string, cardId: string) => void;
  restoreCards: (packId: string) => void;
  toggleActive: (id: string) => void;
  resetToDefaults: () => void;
  setDraws: (n: number) => void;
  setTargetName: (name: string) => void;
  setTargetKind: (kind: CardKind | null) => void;
  setTargetSuit: (suit: Suit | null) => void;
  resetFilters: () => void;
}

/** 按 id 去重合并多包卡牌(跨包同 id 视为同一张) */
function mergeCards(packs: CardPack[]): CardDef[] {
  const map = new Map<string, CardDef>();
  for (const p of packs) {
    for (const c of p.cards) {
      if (!map.has(c.id)) map.set(c.id, c);
    }
  }
  return [...map.values()];
}

export function packById(
  officialPacks: CardPack[],
  customPacks: CardPack[],
  id: string,
): CardPack | undefined {
  return [...officialPacks, ...customPacks].find((p) => p.id === id);
}

async function persistCustom(packs: CardPack[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
  } catch {
    // 存储失败不阻塞 UI(如 Web 隐私模式),仅跳过持久化
  }
}

async function persistActive(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(ids));
  } catch {
    // 同上
  }
}

export const usePackConfig = create<PackConfigState>((set, get) => ({
  officialPacks: OFFICIAL_PACKS,
  customPacks: buildDefaultCustomPacks(),
  activePackIds: ['c-preset-standard'],
  hydrated: false,
  draws: 4,
  targetName: '杀',
  targetKind: null,
  targetSuit: null,

  get activeDeck() {
    const { officialPacks, customPacks, activePackIds } = get();
    const packs = activePackIds
      .map((id) => packById(officialPacks, customPacks, id))
      .filter((p): p is CardPack => Boolean(p));
    return packsToDeck(packs.length ? packs : [customPacks[0] ?? officialPacks[0]]);
  },

  createPack: (name, sourcePackIds) => {
    const { officialPacks, customPacks } = get();
    const sources = sourcePackIds
      .map((id) => packById(officialPacks, customPacks, id))
      .filter((p): p is CardPack => Boolean(p));
    if (sources.length === 0) return null;
    const merged = mergeCards(sources);
    const pack: CardPack = {
      id: `c-${Date.now()}`,
      name: name.trim() || '自定义卡包',
      official: false,
      description: `自定义 · ${sources.map((s) => s.name).join(' + ')} · ${merged.length} 张`,
      composition: sources.map((s) => s.name).join(' + '),
      cards: merged,
    };
    const next = [...customPacks, pack];
    set({ customPacks: next });
    void persistCustom(next);
    return pack.id;
  },

  renamePack: (id, name) => {
    const { customPacks } = get();
    const next = customPacks.map((p) =>
      p.id === id ? { ...p, name: name.trim() || p.name, official: false } : p,
    );
    set({ customPacks: next });
    void persistCustom(next);
  },

  deletePack: (id) => {
    const { customPacks, activePackIds } = get();
    const target = customPacks.find((p) => p.id === id);
    if (!target || target.official) return;
    const next = customPacks.filter((p) => p.id !== id);
    const nextActive = activePackIds.filter((a) => a !== id);
    set({ customPacks: next, activePackIds: nextActive.length ? nextActive : [customPacks[0]?.id ?? 'c-preset-standard'].filter(Boolean) });
    void persistCustom(next);
    void persistActive(nextActive);
  },

  removeCard: (packId, cardId) => {
    const { customPacks } = get();
    const target = customPacks.find((p) => p.id === packId);
    if (!target || target.official) return;
    const next = customPacks.map((p) =>
      p.id === packId ? { ...p, cards: p.cards.filter((c) => c.id !== cardId) } : p,
    );
    set({ customPacks: next });
    void persistCustom(next);
  },

  restoreCards: (packId) => {
    const { customPacks } = get();
    const target = customPacks.find((p) => p.id === packId);
    if (!target || target.official) return;
    // 按组成说明从官方卡包重新合并,实现"恢复全部已删牌"
    const sourceNames = target.composition.split(' + ').map((s) => s.trim());
    const sources = OFFICIAL_PACKS.filter((p) => sourceNames.includes(p.name));
    const base = sources.length ? mergeCards(sources) : buildDefaultCustomPacks()[0].cards;
    const next = customPacks.map((p) =>
      p.id === packId ? { ...p, cards: base, description: `自定义 · ${p.composition} · ${base.length} 张` } : p,
    );
    set({ customPacks: next });
    void persistCustom(next);
  },

  toggleActive: (id) => {
    const { activePackIds, officialPacks, customPacks } = get();
    const next = activePackIds.includes(id)
      ? activePackIds.filter((a) => a !== id)
      : [...activePackIds, id];
    const finalIds = next.length ? next : [id]; // 至少保留一个激活卡包
    set({ activePackIds: finalIds });
    void persistActive(finalIds);
    // 触发 activeDeck 依赖刷新
    set({ activeDeck: computeActiveDeck(officialPacks, customPacks, finalIds) });
  },

  resetToDefaults: () => {
    const defaults = buildDefaultCustomPacks();
    set({ customPacks: defaults, activePackIds: ['c-preset-standard'] });
    void persistCustom(defaults);
    void persistActive(['c-preset-standard']);
  },

  setDraws: (draws) => {
    const max = get().officialPacks.reduce((sum, p) => sum + p.cards.length, 0);
    set({ draws: Math.max(0, Math.min(max, Math.round(draws))) });
  },
  setTargetName: (targetName) => set({ targetName }),
  setTargetKind: (targetKind) => set({ targetKind }),
  setTargetSuit: (targetSuit) => set({ targetSuit }),
  resetFilters: () => set({ draws: 4, targetName: '杀', targetKind: null, targetSuit: null }),
}));

function computeActiveDeck(
  officialPacks: CardPack[],
  customPacks: CardPack[],
  ids: string[],
): DeckDefinition {
  const packs = ids
    .map((id) => packById(officialPacks, customPacks, id))
    .filter((p): p is CardPack => Boolean(p));
  return packsToDeck(packs.length ? packs : [customPacks[0] ?? officialPacks[0]]);
}

/** 启动时从磁盘恢复持久化数据 */
export async function hydratePackConfig(): Promise<void> {
  try {
    const [rawCustom, rawActive] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(ACTIVE_KEY),
    ]);
    const customPacks = rawCustom
      ? (JSON.parse(rawCustom) as CardPack[])
      : buildDefaultCustomPacks();
    const activePackIds = rawActive ? (JSON.parse(rawActive) as string[]) : ['c-preset-standard'];
    usePackConfig.setState({
      customPacks,
      activePackIds,
      activeDeck: computeActiveDeck(OFFICIAL_PACKS, customPacks, activePackIds),
      hydrated: true,
    });
  } catch {
    usePackConfig.setState({
      hydrated: true,
      activeDeck: computeActiveDeck(
        OFFICIAL_PACKS,
        usePackConfig.getState().customPacks,
        usePackConfig.getState().activePackIds,
      ),
    });
  }
}

// 初始 activeDeck
const initialDeck = computeActiveDeck(
  OFFICIAL_PACKS,
  usePackConfig.getState().customPacks,
  usePackConfig.getState().activePackIds,
);
usePackConfig.setState({ activeDeck: initialDeck });
