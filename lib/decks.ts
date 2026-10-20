import type { CardDef } from './cards';

/** 牌库定义:一组可整体选用的牌堆 */
export interface DeckDefinition {
  /** 唯一标识 */
  id: string;
  /** 展示名,如 "标准版" */
  name: string;
  /** 一句话说明(模式/构成) */
  description: string;
  /** 数据来源说明 */
  source: string;
  cards: CardDef[];
}

/** 从牌库中按 id 查找(找不到回退到第一个) */
export function getDeck(decks: DeckDefinition[], id: string): DeckDefinition {
  return decks.find((d) => d.id === id) ?? decks[0];
}
