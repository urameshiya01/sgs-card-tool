import type { CardDef } from './cards';

/**
 * 卡包:统计与概率计算的最小单位。
 * 标准卡包(official)不可修改;自定义卡包(custom)可编辑/删除牌。
 */
export interface CardPack {
  /** 唯一 id。标准卡包用固定 id,自定义卡包用 `c-<时间戳>` */
  id: string;
  /** 展示名 */
  name: string;
  /** 是否官方标准卡包(不可修改) */
  official: boolean;
  /** 一句话说明 */
  description: string;
  /** 组成说明(如 "标准版 + EX") */
  composition: string;
  /** 数据来源(仅标准卡包) */
  source?: string;
  /** 卡牌列表(自定义卡包为编辑后的快照) */
  cards: CardDef[];
}

/** 牌库(供统计/概率页选择的一组卡包) */
export interface DeckDefinition {
  id: string;
  name: string;
  description: string;
  source?: string;
  cards: CardDef[];
}

/** 从卡包列表合成牌库视图 */
export function packsToDeck(packs: CardPack[]): DeckDefinition {
  const name = packs.map((p) => p.name).join('+');
  const cards = packs.flatMap((p) => p.cards);
  return {
    id: packs.map((p) => p.id).join('+'),
    name,
    description: `${name} · ${cards.length} 张`,
    cards,
  };
}

/** 从卡包列表按 id 查找 */
export function getPackById(packs: CardPack[], id: string): CardPack | undefined {
  return packs.find((p) => p.id === id);
}
