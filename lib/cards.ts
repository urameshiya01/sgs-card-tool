/**
 * 牌堆类型定义 —— 用于牌库统计与概率计算
 */
export type Suit = '♠' | '♥' | '♣' | '♦';

/** 花色色值:黑桃墨蓝、红桃红、梅花绿、方片橙 */
export const SUIT_COLORS: Record<Suit, string> = {
  '♠': '#2c3e50',
  '♥': '#e74c3c',
  '♣': '#27ae60',
  '♦': '#e67e22',
};

/** 深色背景上黑桃改用浅色,避免和底色糊在一起 */
export function suitColor(suit: Suit, dark: boolean): string {
  if (dark && suit === '♠') return '#ecf0f1';
  return SUIT_COLORS[suit];
}

/** 抽到的大类:统计时按此聚合 */
export type CardKind = '基本牌' | '锦囊牌' | '装备牌';

/** 单张牌的完整定义 */
export interface CardDef {
  /** 唯一 id,如 "杀-♠-8-0";手动添加的卡牌使用 "m-时间戳-随机数" */
  id: string;
  /** 牌名,如 "杀" */
  name: string;
  /** 大类:基本牌 / 锦囊牌 / 装备牌 */
  kind: CardKind;
  /** 花色 */
  suit: Suit;
  /** 点数:A / 2-10 / J / Q / K;手动添加的卡牌可为 "—" */
  rank: string;
  /** 装备牌子类(可选):武器 / 防具 / ±1坐骑 */
  sub?: string;
  /** 是否 EX 牌(标准版共 4 张) */
  ex?: boolean;
  /** 自定义卡牌的备注描述(可选) */
  description?: string;
}

/** 筛选条件:某一「目标牌集合」的描述 */
export interface TargetFilter {
  /** 按牌名筛选(可选,如 "杀") */
  name?: string;
  /** 按多个牌名筛选(可选);与 name 同时存在时取并集 */
  names?: string[];
  /** 按大类筛选(可选) */
  kind?: CardKind;
  /** 按多个大类筛选(可选) */
  kinds?: CardKind[];
  /** 按花色筛选(可选) */
  suit?: Suit;
  /** 按多个花色筛选(可选) */
  suits?: Suit[];
  /** 按多个点数筛选(可选),如 ["A", "K"] */
  ranks?: string[];
}

/** 根据筛选条件从牌库中选出目标牌 */
export function filterCards(cards: CardDef[], filter: TargetFilter): CardDef[] {
  return cards.filter((card) => {
    if (filter.names !== undefined && filter.names.length > 0 && !filter.names.includes(card.name)) {
      return false;
    }
    if (filter.name !== undefined && card.name !== filter.name) return false;
    if (filter.kinds !== undefined && filter.kinds.length > 0 && !filter.kinds.includes(card.kind)) {
      return false;
    }
    if (filter.kind !== undefined && card.kind !== filter.kind) return false;
    if (filter.suits !== undefined && filter.suits.length > 0 && !filter.suits.includes(card.suit)) {
      return false;
    }
    if (filter.suit !== undefined && card.suit !== filter.suit) return false;
    if (filter.ranks !== undefined && filter.ranks.length > 0 && !filter.ranks.includes(card.rank)) {
      return false;
    }
    return true;
  });
}

/** 按大类统计各类型数量 */
export function countByKind(cards: CardDef[]): Record<CardKind, number> {
  const result: Record<CardKind, number> = { 基本牌: 0, 锦囊牌: 0, 装备牌: 0 };
  for (const card of cards) {
    result[card.kind] += 1;
  }
  return result;
}

/** 按花色统计数量 */
export function countBySuit(cards: CardDef[]): Record<Suit, number> {
  const result: Record<Suit, number> = { '♠': 0, '♥': 0, '♣': 0, '♦': 0 };
  for (const card of cards) {
    result[card.suit] += 1;
  }
  return result;
}

/** 按牌名统计数量,返回按数量降序的列表 */
export function countByName(cards: CardDef[]): Array<{ name: string; count: number }> {
  const map = new Map<string, number>();
  for (const card of cards) {
    map.set(card.name, (map.get(card.name) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));
}
