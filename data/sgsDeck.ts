import type { CardDef, CardKind, Suit } from '@/lib/cards';

/**
 * 三国杀「标准版」牌库 —— 共 108 张游戏牌(含 4 张 EX 牌)。
 *
 * 数据来源(三处相互印证):
 *  - 维基百科「三国杀标准版」游戏牌一览表
 *  - 三国杀 BWIKI「标准包卡牌」牌堆构成表
 *  - 三国杀官方规则集 3.1 身份模式游戏牌列表
 *
 * 构成:基本牌 53(杀30 / 闪15 / 桃8)+ 锦囊牌 36 + 装备牌 19。
 * EX 牌:寒冰剑(♠2)、仁王盾(♣2)、闪电(♥Q)、无懈可击(♦Q)。
 */

type SubKind = '武器' | '防具' | '+1坐骑' | '-1坐骑';

interface Row {
  rank: string;
  /** 每个点数固定两张(牌叠1 / 牌叠2) */
  stack: [string, string];
  /** 该点数上的 EX 牌(如有) */
  ex?: string;
}

/** 牌名 -> [大类, 子类] */
const NAME_KIND: Record<string, [CardKind, SubKind?]> = {
  杀: ['基本牌'],
  闪: ['基本牌'],
  桃: ['基本牌'],
  决斗: ['锦囊牌'],
  闪电: ['锦囊牌'],
  过河拆桥: ['锦囊牌'],
  顺手牵羊: ['锦囊牌'],
  无懈可击: ['锦囊牌'],
  借刀杀人: ['锦囊牌'],
  南蛮入侵: ['锦囊牌'],
  万箭齐发: ['锦囊牌'],
  桃园结义: ['锦囊牌'],
  五谷丰登: ['锦囊牌'],
  无中生有: ['锦囊牌'],
  乐不思蜀: ['锦囊牌'],
  诸葛连弩: ['装备牌', '武器'],
  雌雄双股剑: ['装备牌', '武器'],
  寒冰剑: ['装备牌', '武器'],
  青釭剑: ['装备牌', '武器'],
  青龙偃月刀: ['装备牌', '武器'],
  丈八蛇矛: ['装备牌', '武器'],
  贯石斧: ['装备牌', '武器'],
  方天画戟: ['装备牌', '武器'],
  麒麟弓: ['装备牌', '武器'],
  八卦阵: ['装备牌', '防具'],
  仁王盾: ['装备牌', '防具'],
  绝影: ['装备牌', '+1坐骑'],
  爪黄飞电: ['装备牌', '+1坐骑'],
  的卢: ['装备牌', '+1坐骑'],
  大宛: ['装备牌', '-1坐骑'],
  赤兔: ['装备牌', '-1坐骑'],
  紫骍: ['装备牌', '-1坐骑'],
};

/** 官方牌堆表:每种花色 13 个点数 × 2 张 + 该花色的 EX 牌 = 27 张 */
const TABLE: Record<Suit, Row[]> = {
  '♠': [
    { rank: 'A', stack: ['闪电', '决斗'] },
    { rank: '2', stack: ['雌雄双股剑', '八卦阵'], ex: '寒冰剑' },
    { rank: '3', stack: ['过河拆桥', '顺手牵羊'] },
    { rank: '4', stack: ['过河拆桥', '顺手牵羊'] },
    { rank: '5', stack: ['青龙偃月刀', '绝影'] },
    { rank: '6', stack: ['乐不思蜀', '青釭剑'] },
    { rank: '7', stack: ['杀', '南蛮入侵'] },
    { rank: '8', stack: ['杀', '杀'] },
    { rank: '9', stack: ['杀', '杀'] },
    { rank: '10', stack: ['杀', '杀'] },
    { rank: 'J', stack: ['顺手牵羊', '无懈可击'] },
    { rank: 'Q', stack: ['过河拆桥', '丈八蛇矛'] },
    { rank: 'K', stack: ['南蛮入侵', '大宛'] },
  ],
  '♥': [
    { rank: 'A', stack: ['桃园结义', '万箭齐发'] },
    { rank: '2', stack: ['闪', '闪'] },
    { rank: '3', stack: ['桃', '五谷丰登'] },
    { rank: '4', stack: ['桃', '五谷丰登'] },
    { rank: '5', stack: ['麒麟弓', '赤兔'] },
    { rank: '6', stack: ['桃', '乐不思蜀'] },
    { rank: '7', stack: ['桃', '无中生有'] },
    { rank: '8', stack: ['桃', '无中生有'] },
    { rank: '9', stack: ['桃', '无中生有'] },
    { rank: '10', stack: ['杀', '杀'] },
    { rank: 'J', stack: ['杀', '无中生有'] },
    { rank: 'Q', stack: ['桃', '过河拆桥'], ex: '闪电' },
    { rank: 'K', stack: ['闪', '爪黄飞电'] },
  ],
  '♣': [
    { rank: 'A', stack: ['决斗', '诸葛连弩'] },
    { rank: '2', stack: ['杀', '八卦阵'], ex: '仁王盾' },
    { rank: '3', stack: ['杀', '过河拆桥'] },
    { rank: '4', stack: ['杀', '过河拆桥'] },
    { rank: '5', stack: ['杀', '的卢'] },
    { rank: '6', stack: ['杀', '乐不思蜀'] },
    { rank: '7', stack: ['杀', '南蛮入侵'] },
    { rank: '8', stack: ['杀', '杀'] },
    { rank: '9', stack: ['杀', '杀'] },
    { rank: '10', stack: ['杀', '杀'] },
    { rank: 'J', stack: ['杀', '杀'] },
    { rank: 'Q', stack: ['借刀杀人', '无懈可击'] },
    { rank: 'K', stack: ['借刀杀人', '无懈可击'] },
  ],
  '♦': [
    { rank: 'A', stack: ['诸葛连弩', '决斗'] },
    { rank: '2', stack: ['闪', '闪'] },
    { rank: '3', stack: ['闪', '顺手牵羊'] },
    { rank: '4', stack: ['闪', '顺手牵羊'] },
    { rank: '5', stack: ['闪', '贯石斧'] },
    { rank: '6', stack: ['杀', '闪'] },
    { rank: '7', stack: ['杀', '闪'] },
    { rank: '8', stack: ['杀', '闪'] },
    { rank: '9', stack: ['杀', '闪'] },
    { rank: '10', stack: ['杀', '闪'] },
    { rank: 'J', stack: ['闪', '闪'] },
    { rank: 'Q', stack: ['桃', '方天画戟'], ex: '无懈可击' },
    { rank: 'K', stack: ['杀', '紫骍'] },
  ],
};

function buildDeck(): CardDef[] {
  const cards: CardDef[] = [];
  for (const suit of Object.keys(TABLE) as Suit[]) {
    for (const row of TABLE[suit]) {
      row.stack.forEach((name, i) => {
        const [kind, sub] = NAME_KIND[name];
        cards.push({ id: `${name}-${suit}-${row.rank}-${i}`, name, kind, suit, rank: row.rank, sub });
      });
      if (row.ex) {
        const [kind, sub] = NAME_KIND[row.ex];
        cards.push({ id: `${row.ex}-${suit}-${row.rank}-EX`, name: row.ex, kind, suit, rank: row.rank, sub, ex: true });
      }
    }
  }
  return cards;
}

export const DECK: CardDef[] = buildDeck();
export const DECK_SIZE = DECK.length;
/** EX 牌数量(标准版为 4 张) */
export const EX_COUNT = DECK.filter((c) => c.ex).length;
