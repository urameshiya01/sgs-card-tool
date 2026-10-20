/**
 * 牌堆类型定义 —— 用于牌库统计与概率计算
 */
export type Suit = '♠' | '♥' | '♣' | '♦';

/** 抽到的大类:统计时按此聚合 */
export type CardKind = '基本牌' | '锦囊牌' | '装备牌';

/** 单张牌的完整定义 */
export interface CardDef {
  /** 唯一 id,如 "杀-♠-8-0" */
  id: string;
  /** 牌名,如 "杀" */
  name: string;
  /** 大类:基本牌 / 锦囊牌 / 装备牌 */
  kind: CardKind;
  /** 花色 */
  suit: Suit;
  /** 点数:A / 2-10 / J / Q / K */
  rank: string;
  /** 装备牌子类(可选):武器 / 防具 / ±1坐骑 */
  sub?: string;
  /** 是否 EX 牌(标准版共 4 张) */
  ex?: boolean;
}

/** 筛选条件:某一「目标牌集合」的描述 */
export interface TargetFilter {
  /** 按牌名筛选(可选,如 "杀") */
  name?: string;
  /** 按大类筛选(可选) */
  kind?: CardKind;
  /** 按花色筛选(可选) */
  suit?: Suit;
}

/** 根据筛选条件从牌库中选出目标牌 */
export function filterCards(cards: CardDef[], filter: TargetFilter): CardDef[] {
  return cards.filter((card) => {
    if (filter.name !== undefined && card.name !== filter.name) return false;
    if (filter.kind !== undefined && card.kind !== filter.kind) return false;
    if (filter.suit !== undefined && card.suit !== filter.suit) return false;
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
