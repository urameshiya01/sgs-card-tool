import type { CardDef } from '../lib/cards';
import type { CardPack } from '../lib/packs';
import { buildDeckFromTable, PACK_IDS, type NameKindMap, type DeckTable } from '../lib/deckBuilder';

/**
 * 官方基础卡包:
 *  - 标准版(104,不含 EX)
 *  - EX(4:寒冰剑/仁王盾/闪电/无懈可击♦Q)
 *  - 军争篇(52)
 *  - 国战(108)
 *
 * 另提供两个常用的合并预设(作为自定义卡包的默认项):
 *  - 「标准」= 标准版 + EX(108 张)
 *  - 「军争」= 标准版 + EX + 军争篇(160 张)
 *
 * 数据来源:三国杀官方规则集 3.1/3.2、BWiki、gltjk.com。
 */

const NAME_KIND: NameKindMap = {
  杀: ['基本牌'],
  火杀: ['基本牌'],
  雷杀: ['基本牌'],
  闪: ['基本牌'],
  桃: ['基本牌'],
  酒: ['基本牌'],
  决斗: ['锦囊牌'],
  闪电: ['锦囊牌'],
  过河拆桥: ['锦囊牌'],
  顺手牵羊: ['锦囊牌'],
  无懈可击: ['锦囊牌'],
  '无懈可击·国': ['锦囊牌'],
  借刀杀人: ['锦囊牌'],
  南蛮入侵: ['锦囊牌'],
  万箭齐发: ['锦囊牌'],
  桃园结义: ['锦囊牌'],
  五谷丰登: ['锦囊牌'],
  无中生有: ['锦囊牌'],
  乐不思蜀: ['锦囊牌'],
  火攻: ['锦囊牌'],
  铁索连环: ['锦囊牌'],
  兵粮寸断: ['锦囊牌'],
  以逸待劳: ['锦囊牌'],
  知己知彼: ['锦囊牌'],
  远交近攻: ['锦囊牌'],
  诸葛连弩: ['装备牌', '武器'],
  雌雄双股剑: ['装备牌', '武器'],
  寒冰剑: ['装备牌', '武器'],
  青釭剑: ['装备牌', '武器'],
  青龙偃月刀: ['装备牌', '武器'],
  丈八蛇矛: ['装备牌', '武器'],
  贯石斧: ['装备牌', '武器'],
  方天画戟: ['装备牌', '武器'],
  麒麟弓: ['装备牌', '武器'],
  朱雀羽扇: ['装备牌', '武器'],
  古锭刀: ['装备牌', '武器'],
  吴六剑: ['装备牌', '武器'],
  三尖两刃刀: ['装备牌', '武器'],
  八卦阵: ['装备牌', '防具'],
  仁王盾: ['装备牌', '防具'],
  藤甲: ['装备牌', '防具'],
  白银狮子: ['装备牌', '防具'],
  太平要术: ['装备牌', '防具'],
  绝影: ['装备牌', '+1坐骑'],
  爪黄飞电: ['装备牌', '+1坐骑'],
  的卢: ['装备牌', '+1坐骑'],
  骅骝: ['装备牌', '+1坐骑'],
  大宛: ['装备牌', '-1坐骑'],
  赤兔: ['装备牌', '-1坐骑'],
  紫骍: ['装备牌', '-1坐骑'],
};

/** 标准版牌堆(含 EX 标注),身份模式 */
const STANDARD_TABLE: DeckTable = {
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

/** 军争篇追加的 52 张:在标准牌堆点数位置上追加(extra),EX 不重复计入 */
const JUNZHENG_TABLE: DeckTable = {
  '♠': [
    { rank: 'A', stack: [], extra: ['古锭刀'] },
    { rank: '2', stack: [], extra: ['藤甲'] },
    { rank: '3', stack: [], extra: ['酒'] },
    { rank: '4', stack: [], extra: ['雷杀'] },
    { rank: '5', stack: [], extra: ['雷杀'] },
    { rank: '6', stack: [], extra: ['雷杀'] },
    { rank: '7', stack: [], extra: ['雷杀'] },
    { rank: '8', stack: [], extra: ['雷杀'] },
    { rank: '9', stack: [], extra: ['酒'] },
    { rank: '10', stack: [], extra: ['兵粮寸断'] },
    { rank: 'J', stack: [], extra: ['铁索连环'] },
    { rank: 'Q', stack: [], extra: ['铁索连环'] },
    { rank: 'K', stack: [], extra: ['无懈可击'] },
  ],
  '♥': [
    { rank: 'A', stack: [], extra: ['无懈可击'] },
    { rank: '2', stack: [], extra: ['火攻'] },
    { rank: '3', stack: [], extra: ['火攻'] },
    { rank: '4', stack: [], extra: ['火杀'] },
    { rank: '5', stack: [], extra: ['桃'] },
    { rank: '6', stack: [], extra: ['桃'] },
    { rank: '7', stack: [], extra: ['火杀'] },
    { rank: '8', stack: [], extra: ['闪'] },
    { rank: '9', stack: [], extra: ['闪'] },
    { rank: '10', stack: [], extra: ['火杀'] },
    { rank: 'J', stack: [], extra: ['闪'] },
    { rank: 'Q', stack: [], extra: ['闪'] },
    { rank: 'K', stack: [], extra: ['无懈可击'] },
  ],
  '♣': [
    { rank: 'A', stack: [], extra: ['白银狮子'] },
    { rank: '2', stack: [], extra: ['藤甲'] },
    { rank: '3', stack: [], extra: ['酒'] },
    { rank: '4', stack: [], extra: ['兵粮寸断'] },
    { rank: '5', stack: [], extra: ['雷杀'] },
    { rank: '6', stack: [], extra: ['雷杀'] },
    { rank: '7', stack: [], extra: ['雷杀'] },
    { rank: '8', stack: [], extra: ['雷杀'] },
    { rank: '9', stack: [], extra: ['酒'] },
    { rank: '10', stack: [], extra: ['铁索连环'] },
    { rank: 'J', stack: [], extra: ['铁索连环'] },
    { rank: 'Q', stack: [], extra: ['铁索连环'] },
    { rank: 'K', stack: [], extra: ['铁索连环'] },
  ],
  '♦': [
    { rank: 'A', stack: [], extra: ['朱雀羽扇'] },
    { rank: '2', stack: [], extra: ['桃'] },
    { rank: '3', stack: [], extra: ['桃'] },
    { rank: '4', stack: [], extra: ['火杀'] },
    { rank: '5', stack: [], extra: ['火杀'] },
    { rank: '6', stack: [], extra: ['闪'] },
    { rank: '7', stack: [], extra: ['闪'] },
    { rank: '8', stack: [], extra: ['闪'] },
    { rank: '9', stack: [], extra: ['酒'] },
    { rank: '10', stack: [], extra: ['闪'] },
    { rank: 'J', stack: [], extra: ['闪'] },
    { rank: 'Q', stack: [], extra: ['火攻'] },
    { rank: 'K', stack: [], extra: ['骅骝'] },
  ],
};

/** 国战基础牌堆 108 张 */
const GUOZHAN_TABLE: DeckTable = {
  '♠': [
    { rank: 'A', stack: ['闪电', '决斗'] },
    { rank: '2', stack: ['雌雄双股剑', '寒冰剑', '八卦阵'] },
    { rank: '3', stack: ['过河拆桥', '顺手牵羊'] },
    { rank: '4', stack: ['过河拆桥', '顺手牵羊'] },
    { rank: '5', stack: ['杀', '绝影'] },
    { rank: '6', stack: ['青釭剑', '雷杀'] },
    { rank: '7', stack: ['杀', '雷杀'] },
    { rank: '8', stack: ['杀', '杀'] },
    { rank: '9', stack: ['杀', '酒'] },
    { rank: '10', stack: ['杀', '兵粮寸断'] },
    { rank: 'J', stack: ['杀', '无懈可击'] },
    { rank: 'Q', stack: ['铁索连环', '丈八蛇矛'] },
    { rank: 'K', stack: ['南蛮入侵', '大宛'] },
  ],
  '♥': [
    { rank: 'A', stack: ['万箭齐发', '桃园结义'] },
    { rank: '2', stack: ['闪', '火攻'] },
    { rank: '3', stack: ['五谷丰登', '火攻'] },
    { rank: '4', stack: ['桃', '火杀'] },
    { rank: '5', stack: ['麒麟弓', '赤兔'] },
    { rank: '6', stack: ['桃', '乐不思蜀'] },
    { rank: '7', stack: ['桃', '无中生有'] },
    { rank: '8', stack: ['桃', '无中生有'] },
    { rank: '9', stack: ['桃', '远交近攻'] },
    { rank: '10', stack: ['桃', '杀'] },
    { rank: 'J', stack: ['闪', '以逸待劳'] },
    { rank: 'Q', stack: ['桃', '过河拆桥', '杀'] },
    { rank: 'K', stack: ['闪', '爪黄飞电'] },
  ],
  '♣': [
    { rank: 'A', stack: ['决斗', '白银狮子'] },
    { rank: '2', stack: ['杀', '仁王盾', '藤甲'] },
    { rank: '3', stack: ['杀', '知己知彼'] },
    { rank: '4', stack: ['杀', '知己知彼', '兵粮寸断'] },
    { rank: '5', stack: ['杀', '的卢'] },
    { rank: '6', stack: ['雷杀', '乐不思蜀'] },
    { rank: '7', stack: ['雷杀', '南蛮入侵'] },
    { rank: '8', stack: ['杀', '雷杀'] },
    { rank: '9', stack: ['杀', '酒'] },
    { rank: '10', stack: ['杀'] },
    { rank: 'J', stack: ['杀', '杀'] },
    { rank: 'Q', stack: ['借刀杀人', '铁索连环'] },
    { rank: 'K', stack: ['无懈可击·国', '铁索连环'] },
  ],
  '♦': [
    { rank: 'A', stack: ['诸葛连弩', '朱雀羽扇'] },
    { rank: '2', stack: ['闪', '桃'] },
    { rank: '3', stack: ['闪', '顺手牵羊'] },
    { rank: '4', stack: ['火杀', '以逸待劳'] },
    { rank: '5', stack: ['火杀', '贯石斧'] },
    { rank: '6', stack: ['吴六剑', '闪'] },
    { rank: '7', stack: ['闪', '闪'] },
    { rank: '8', stack: ['闪', '闪'] },
    { rank: '9', stack: ['闪', '酒'] },
    { rank: '10', stack: ['杀', '闪'] },
    { rank: 'J', stack: ['杀', '闪'] },
    { rank: 'Q', stack: ['三尖两刃刀', '无懈可击·国', '杀'] },
    { rank: 'K', stack: ['闪', '紫骍'] },
  ],
};

const SOURCE = '三国杀官方规则集 3.1/3.2、BWiki、gltjk.com';

export const STANDARD_PACK: CardPack = {
  id: PACK_IDS.standard,
  name: '标准版',
  official: true,
  description: '标准版正文 · 104 张(不含 EX)',
  composition: '标准版(不含 EX)',
  source: SOURCE,
  cards: buildDeckFromTable(STANDARD_TABLE, NAME_KIND, { excludeEx: true }),
};

export const EX_PACK: CardPack = {
  id: PACK_IDS.ex,
  name: 'EX',
  official: true,
  description: '标准版 EX 牌 · 4 张(寒冰剑/仁王盾/闪电/无懈可击)',
  composition: '标准版 EX',
  source: SOURCE,
  cards: buildDeckFromTable(STANDARD_TABLE, NAME_KIND, { onlyEx: true }),
};

export const JUNZHENG_PACK: CardPack = {
  id: PACK_IDS.junzheng,
  name: '军争篇',
  official: true,
  description: '神话再临·军争篇 · 52 张',
  composition: '军争篇',
  source: SOURCE,
  cards: buildDeckFromTable(JUNZHENG_TABLE, NAME_KIND),
};

export const GUOZHAN_PACK: CardPack = {
  id: PACK_IDS.guozhan,
  name: '国战',
  official: true,
  description: '国战模式 · 108 张(不含阵/势/势备篇)',
  composition: '国战基础牌堆',
  source: SOURCE,
  cards: buildDeckFromTable(GUOZHAN_TABLE, NAME_KIND),
};

/** 官方标准卡包(不可修改) */
export const OFFICIAL_PACKS: CardPack[] = [STANDARD_PACK, EX_PACK, JUNZHENG_PACK, GUOZHAN_PACK];

/** 生成两个默认合并卡包快照:「标准」= 标准+EX;「军争」= 标准+EX+军争篇 */
export function buildDefaultCustomPacks(): CardPack[] {
  return [
    {
      id: 'c-preset-standard',
      name: '标准',
      official: false,
      description: '默认合并 · 标准版 + EX',
      composition: '标准版 + EX',
      cards: [...STANDARD_PACK.cards, ...EX_PACK.cards],
    },
    {
      id: 'c-preset-junzheng',
      name: '军争',
      official: false,
      description: '默认合并 · 标准版 + EX + 军争篇',
      composition: '标准版 + EX + 军争篇',
      cards: [...STANDARD_PACK.cards, ...EX_PACK.cards, ...JUNZHENG_PACK.cards],
    },
  ];
}
