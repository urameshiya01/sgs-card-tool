import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardDef, CardKind, Suit } from '@/lib/cards';
import type { CardPack, DeckDefinition } from '@/lib/packs';
import { packsToDeck } from '@/lib/packs';
import { OFFICIAL_PACKS, buildDefaultCustomPacks } from '@/data/officialPacks';

const STORAGE_KEY = '@sgs-card-tool/custom-packs-v2';
const ACTIVE_KEY = '@sgs-card-tool/active-pack-ids-v1';

/** 手动添加卡牌的输入 */
export interface ManualCardInput {
  name: string;
  kind: CardKind;
  suit: Suit;
  /** 点数,如 A / 10 / J;不传则保持原值 */
  rank?: string;
  /** 备注描述(可选) */
  description?: string;
}

export interface PackConfigState {
  /** 官方标准卡包(只读) */
  officialPacks: CardPack[];
  /** 自定义卡包(含两个默认合并包,可编辑/删除) */
  customPacks: CardPack[];
  /** 当前激活的卡包 id 列表(可为空 = 不选任何卡包) */
  activePackIds: string[];
  /** 是否已从磁盘恢复 */
  hydrated: boolean;
  /** 由激活卡包合成的牌库视图(可为空牌库) */
  activeDeck: DeckDefinition;
  /** 抽取张数 n(概率页) */
  draws: number;
  /** 目标筛选:牌名,可多选;空数组表示不按牌名限制 */
  targetNames: string[];
  /** 目标筛选:大类,空数组表示不限 */
  targetKinds: CardKind[];
  /** 目标筛选:花色,空数组表示不限 */
  targetSuits: Suit[];
  /** 目标筛选:点数,空数组表示不限 */
  targetRanks: string[];

  /** 新建空的自定义卡包 */
  createPack: (name: string) => string;
  /** 基于若干卡包合并生成新的自定义卡包 */
  createPackFromPacks: (name: string, sourcePackIds: string[]) => string | null;
  renamePack: (id: string, name: string) => void;
  deletePack: (id: string) => void;
  /** 删除卡包内的一张牌 */
  removeCard: (packId: string, cardId: string) => void;
  /** 手动添加一张自定义卡牌(可指定数量) */
  addCard: (packId: string, input: ManualCardInput, count?: number) => void;
  /** 修改一张自定义卡牌 */
  updateCard: (packId: string, cardId: string, input: ManualCardInput) => void;
  /** 从其他卡包批量导入卡牌到当前卡包(按 id 去重) */
  importCards: (packId: string, fromPackId: string, cardIds?: string[]) => number;
  /** 按组成恢复卡包(从官方源重新合并) */
  restoreCards: (packId: string) => void;
  /** 切换激活状态(允许全不选) */
  toggleActive: (id: string) => void;
  resetToDefaults: () => void;
  setDraws: (n: number) => void;
  /** 一次写入已确认的目标牌名 */
  setTargetNames: (names: string[]) => void;
  toggleTargetName: (name: string) => void;
  toggleTargetKind: (kind: CardKind) => void;
  toggleTargetSuit: (suit: Suit) => void;
  toggleTargetRank: (rank: string) => void;
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

/** 生成手动卡牌的唯一 id */
function manualCardId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 手动卡牌的占位点数 */
export const MANUAL_RANK = '—';

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
  targetNames: ['杀'],
  targetKinds: [],
  targetSuits: [],
  targetRanks: [],
  activeDeck: packsToDeck([]),

  createPack: (name) => {
    const { customPacks } = get();
    const pack: CardPack = {
      id: `c-${Date.now()}`,
      name: name.trim() || `自定义卡包 ${customPacks.length + 1}`,
      official: false,
      description: '自定义 · 空卡包 · 0 张',
      composition: '手动创建',
      cards: [],
    };
    const next = [...customPacks, pack];
    set({ customPacks: next });
    void persistCustom(next);
    return pack.id;
  },

  createPackFromPacks: (name, sourcePackIds) => {
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
    // 允许激活列表为空:不强制保留最后一个
    const nextActive = activePackIds.filter((a) => a !== id);
    set({
      customPacks: next,
      activePackIds: nextActive,
      activeDeck: computeActiveDeck(get().officialPacks, next, nextActive),
    });
    void persistCustom(next);
    void persistActive(nextActive);
  },

  removeCard: (packId, cardId) => {
    const { customPacks } = get();
    const target = customPacks.find((p) => p.id === packId);
    if (!target || target.official) return;
    const next = customPacks.map((p) =>
      p.id === packId
        ? {
            ...p,
            cards: p.cards.filter((c) => c.id !== cardId),
            description: `自定义 · ${p.composition} · ${p.cards.length - 1} 张`,
          }
        : p,
    );
    set({ customPacks: next });
    void persistCustom(next);
  },

  addCard: (packId, input, count = 1) => {
    const { customPacks } = get();
    const target = customPacks.find((p) => p.id === packId);
    if (!target || target.official) return;
    const newCards: CardDef[] = Array.from({ length: Math.max(1, count) }, () => ({
      id: manualCardId(),
      name: input.name.trim(),
      kind: input.kind,
      suit: input.suit,
      rank: MANUAL_RANK,
      description: input.description?.trim() || undefined,
    }));
    const next = customPacks.map((p) =>
      p.id === packId
        ? {
            ...p,
            cards: [...p.cards, ...newCards],
            description: `自定义 · ${p.composition} · ${p.cards.length + newCards.length} 张`,
          }
        : p,
    );
    set({ customPacks: next });
    void persistCustom(next);
  },

  updateCard: (packId, cardId, input) => {
    const { customPacks } = get();
    const target = customPacks.find((p) => p.id === packId);
    if (!target || target.official) return;
    const next = customPacks.map((p) =>
      p.id === packId
        ? {
            ...p,
            cards: p.cards.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    name: input.name.trim() || c.name,
                    kind: input.kind,
                    suit: input.suit,
                    rank: input.rank?.trim() || c.rank,
                    description: input.description?.trim() || undefined,
                  }
                : c,
            ),
          }
        : p,
    );
    set({ customPacks: next });
    void persistCustom(next);
  },

  importCards: (packId, fromPackId, cardIds) => {
    const { officialPacks, customPacks } = get();
    const target = customPacks.find((p) => p.id === packId);
    const source = packById(officialPacks, customPacks, fromPackId);
    if (!target || target.official || !source || source.id === packId) return 0;
    const selected = cardIds ? source.cards.filter((c) => cardIds.includes(c.id)) : source.cards;
    const existing = new Set(target.cards.map((c) => c.id));
    const toAdd = selected.filter((c) => !existing.has(c.id));
    if (toAdd.length === 0) return 0;
    const next = customPacks.map((p) =>
      p.id === packId
        ? {
            ...p,
            cards: [...p.cards, ...toAdd],
            description: `自定义 · ${p.composition} · ${p.cards.length + toAdd.length} 张`,
          }
        : p,
    );
    set({ customPacks: next });
    void persistCustom(next);
    return toAdd.length;
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
      p.id === packId
        ? { ...p, cards: base, description: `自定义 · ${p.composition} · ${base.length} 张` }
        : p,
    );
    set({ customPacks: next });
    void persistCustom(next);
  },

  toggleActive: (id) => {
    const { activePackIds, officialPacks, customPacks } = get();
    // 允许全部取消:不做"至少保留一个"限制
    const next = activePackIds.includes(id)
      ? activePackIds.filter((a) => a !== id)
      : [...activePackIds, id];
    set({
      activePackIds: next,
      activeDeck: computeActiveDeck(officialPacks, customPacks, next),
    });
    void persistActive(next);
  },

  resetToDefaults: () => {
    const defaults = buildDefaultCustomPacks();
    set({
      customPacks: defaults,
      activePackIds: ['c-preset-standard'],
      activeDeck: computeActiveDeck(get().officialPacks, defaults, ['c-preset-standard']),
    });
    void persistCustom(defaults);
    void persistActive(['c-preset-standard']);
  },

  setDraws: (draws) => {
    const max = get().officialPacks.reduce((sum, p) => sum + p.cards.length, 0);
    set({ draws: Math.max(0, Math.min(max, Math.round(draws))) });
  },
  setTargetNames: (names) => {
    const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
    set({ targetNames: unique });
  },
  toggleTargetName: (name) => {
    const { targetNames } = get();
    set({
      targetNames: targetNames.includes(name)
        ? targetNames.filter((item) => item !== name)
        : [...targetNames, name],
    });
  },
  toggleTargetKind: (kind) => {
    const { targetKinds } = get();
    set({
      targetKinds: targetKinds.includes(kind)
        ? targetKinds.filter((item) => item !== kind)
        : [...targetKinds, kind],
    });
  },
  toggleTargetSuit: (suit) => {
    const { targetSuits } = get();
    set({
      targetSuits: targetSuits.includes(suit)
        ? targetSuits.filter((item) => item !== suit)
        : [...targetSuits, suit],
    });
  },
  toggleTargetRank: (rank) => {
    const { targetRanks } = get();
    set({
      targetRanks: targetRanks.includes(rank)
        ? targetRanks.filter((item) => item !== rank)
        : [...targetRanks, rank],
    });
  },
  resetFilters: () =>
    set({ draws: 4, targetNames: ['杀'], targetKinds: [], targetSuits: [], targetRanks: [] }),
}));

function computeActiveDeck(
  officialPacks: CardPack[],
  customPacks: CardPack[],
  ids: string[],
): DeckDefinition {
  const packs = ids
    .map((id) => packById(officialPacks, customPacks, id))
    .filter((p): p is CardPack => Boolean(p));
  return packsToDeck(packs);
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
usePackConfig.setState({
  activeDeck: computeActiveDeck(
    OFFICIAL_PACKS,
    usePackConfig.getState().customPacks,
    usePackConfig.getState().activePackIds,
  ),
});
