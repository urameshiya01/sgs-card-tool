import type { CardDef, CardKind, Suit } from './cards';

/** 装备牌子类 */
export type SubKind = '武器' | '防具' | '+1坐骑' | '-1坐骑';

/** 一张牌定义:牌名 -> [大类, 装备子类?] */
export type NameKindMap = Record<string, [CardKind, SubKind?]>;

/** 某一花色下某点数的牌行 */
export interface DeckRow {
  rank: string;
  /** 同一点数上的多张牌(按牌叠顺序) */
  stack: string[];
  /** 该点数上的扩展追加牌(如军争篇加牌),排在 stack 之后 */
  extra?: string[];
  /** 该点数上的 EX 牌(仅标准/军争体系有 EX 概念) */
  ex?: string;
}

/** 牌堆表:花色 -> 点数行列表 */
export type DeckTable = Record<Suit, DeckRow[]>;

/**
 * 由牌堆表构建卡牌列表。
 * id 规则:`牌名-花色-点数-组内序号`,EX 牌追加 `-EX`,保证全库唯一。
 */
export function buildDeckFromTable(table: DeckTable, nameKind: NameKindMap): CardDef[] {
  const cards: CardDef[] = [];
  for (const suit of Object.keys(table) as Suit[]) {
    for (const row of table[suit]) {
      row.stack.forEach((name, i) => {
        const [kind, sub] = nameKind[name];
        if (!kind) {
          throw new Error(`buildDeckFromTable: 牌名「${name}」缺少类别定义`);
        }
        cards.push({ id: `${name}-${suit}-${row.rank}-${i}`, name, kind, suit, rank: row.rank, sub });
      });
      if (row.extra) {
        row.extra.forEach((name, i) => {
          const [kind, sub] = nameKind[name];
          if (!kind) {
            throw new Error(`buildDeckFromTable: 扩展牌「${name}」缺少类别定义`);
          }
          cards.push({
            id: `${name}-${suit}-${row.rank}-x${i}`,
            name,
            kind,
            suit,
            rank: row.rank,
            sub,
          });
        });
      }
      if (row.ex) {
        const [kind, sub] = nameKind[row.ex];
        if (!kind) {
          throw new Error(`buildDeckFromTable: EX 牌「${row.ex}」缺少类别定义`);
        }
        cards.push({
          id: `${row.ex}-${suit}-${row.rank}-EX`,
          name: row.ex,
          kind,
          suit,
          rank: row.rank,
          sub,
          ex: true,
        });
      }
    }
  }
  return cards;
}
