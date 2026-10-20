/**
 * 冒烟测试:用 TypeScript 编译器 API 将核心模块转译为 JS 后在 Node 中运行。
 * 用法: node scripts/smoke-test.js
 *
 * "@/" 别名导入在转译后改写为相对路径。
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const os = require('os');

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgs-smoke-'));

const files = [
  'lib/cards.ts',
  'lib/probability.ts',
  'lib/decks.ts',
  'lib/packs.ts',
  'lib/deckBuilder.ts',
  'data/officialPacks.ts',
  'data/index.ts',
];

function toJs(file) {
  const src = fs.readFileSync(file, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const rewritten = js
    .replace(/require\("@\/data\/officialPacks"\)/g, 'require("./data/officialPacks.js")')
    .replace(/require\("@\/data"\)/g, 'require("./data/index.js")')
    .replace(/require\("@\/lib\/(\w+)"\)/g, 'require("./lib/$1.js")')
    .replace(/require\("\.\.\/\.\.\/lib\/(\w+)"\)/g, 'require("../../lib/$1.js")')
    .replace(/require\("\.\.\/lib\/(\w+)"\)/g, 'require("../lib/$1.js")')
    .replace(/require\("\.\/cards"\)/g, 'require("../../lib/cards.js")')
    .replace(/require\("\.\/decks"\)/g, 'require("../../lib/decks.js")')
    .replace(/require\("\.\/deckBuilder"\)/g, 'require("../../lib/deckBuilder.js")')
    .replace(/require\("\.\/officialPacks"\)/g, 'require("./officialPacks.js")');
  const outPath = path.join(outDir, file.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, rewritten);
}

files.forEach(toJs);

const {
  OFFICIAL_PACKS,
  STANDARD_PACK,
  EX_PACK,
  JUNZHENG_PACK,
  GUOZHAN_PACK,
  buildDefaultCustomPacks,
} = require(path.join(outDir, 'data/index.js'));
const { countByKind, countBySuit, filterCards } = require(path.join(outDir, 'lib/cards.js'));
const { packsToDeck } = require(path.join(outDir, 'lib/packs.js'));
const { combinations, hypergeometricAtLeast, hypergeometricPMF, binomialAtLeast } = require(
  path.join(outDir, 'lib/probability.js'),
);

let failed = 0;
function check(name, actual, expected, tol = 0) {
  const ok =
    typeof expected === 'number' && tol > 0
      ? Math.abs(actual - expected) <= tol
      : actual === expected;
  if (!ok) {
    failed++;
    console.error(`✗ ${name}: 期望 ${JSON.stringify(expected)},实际 ${JSON.stringify(actual)}`);
  } else {
    console.log(`✓ ${name} = ${typeof actual === 'object' ? JSON.stringify(actual) : actual}`);
  }
}

// ---- 引擎抽查 ----
check('C(52,5)', combinations(52, 5), 2598960);
{
  const N = 108, K = 30, n = 4;
  const pNone = combinations(N - K, n) / combinations(N, n);
  check('P(108牌库抽4至少1杀)', hypergeometricAtLeast(N, K, n, 1), 1 - pNone, 1e-12);
  let sum = 0;
  for (let m = 0; m <= n; m++) sum += hypergeometricPMF(N, K, n, m);
  check('PMF 全分布求和 = 1', sum, 1, 1e-12);
}
check('B(10,0.5,≥5)', binomialAtLeast(10, 0.5, 5), 0.623046875, 1e-12);

// ---- 官方标准卡包 ----
function packChecks(pack, expect) {
  console.log(`\n—— 卡包「${pack.name}」——`);
  check('张数', pack.cards.length, expect.total);
  check('official 标记', pack.official, expect.official ?? true);
  check('花色分布', JSON.stringify(countBySuit(pack.cards)), JSON.stringify(expect.suits));
  check('类型分布', JSON.stringify(countByKind(pack.cards)), JSON.stringify(expect.kinds));
  for (const [name, count] of Object.entries(expect.names)) {
    check(`「${name}」张数`, filterCards(pack.cards, { name }).length, count);
  }
  check('无重复 id', new Set(pack.cards.map((c) => c.id)).size, expect.total);
}

packChecks(STANDARD_PACK, {
  total: 104,
  suits: { '♠': 26, '♥': 26, '♣': 26, '♦': 26 },
  kinds: { 基本牌: 53, 锦囊牌: 34, 装备牌: 17 },
  names: { 杀: 30, 闪: 15, 桃: 8, 无懈可击: 3, 寒冰剑: 0 },
});

packChecks(EX_PACK, {
  total: 4,
  suits: { '♠': 1, '♥': 1, '♣': 1, '♦': 1 },
  kinds: { 基本牌: 0, 锦囊牌: 2, 装备牌: 2 },
  names: { 寒冰剑: 1, 仁王盾: 1, 闪电: 1, 无懈可击: 1 },
});

packChecks(JUNZHENG_PACK, {
  total: 52,
  suits: { '♠': 13, '♥': 13, '♣': 13, '♦': 13 },
  kinds: { 基本牌: 32, 锦囊牌: 14, 装备牌: 6 },
  names: {
    火杀: 5, 雷杀: 9, 闪: 9, 桃: 4, 酒: 5,
    火攻: 3, 铁索连环: 6, 兵粮寸断: 2, 无懈可击: 3,
    藤甲: 2, 白银狮子: 1, 朱雀羽扇: 1, 古锭刀: 1, 骅骝: 1,
  },
});

packChecks(GUOZHAN_PACK, {
  total: 108,
  suits: { '♠': 27, '♥': 27, '♣': 27, '♦': 27 },
  kinds: { 基本牌: 54, 锦囊牌: 34, 装备牌: 20 },
  names: {
    杀: 21, 火杀: 3, 雷杀: 5, 闪: 14, 桃: 8, 酒: 3,
    铁索连环: 3, 火攻: 2, 兵粮寸断: 2, 以逸待劳: 2, 知己知彼: 2, 远交近攻: 1,
    '无懈可击·国': 2, 吴六剑: 1, 三尖两刃刀: 1,
  },
});

check('官方卡包数量', OFFICIAL_PACKS.length, 4);

// ---- 默认自定义合并卡包 ----
const defaults = buildDefaultCustomPacks();
console.log('\n—— 默认自定义卡包 ——');
check('默认自定义数量', defaults.length, 2);
const stdMerge = defaults.find((d) => d.id === 'c-preset-standard');
const jzMerge = defaults.find((d) => d.id === 'c-preset-junzheng');
check('「标准」合并张数', stdMerge.cards.length, 108);
check('「军争」合并张数', jzMerge.cards.length, 160);
check('「标准」含 EX 寒冰剑', filterCards(stdMerge.cards, { name: '寒冰剑' }).length, 1);
check('「军争」含火杀', filterCards(jzMerge.cards, { name: '火杀' }).length, 5);
check('「军争」花色每色40', Object.values(countBySuit(jzMerge.cards)).every((n) => n === 40), true);
check('「军争」无重复 id', new Set(jzMerge.cards.map((c) => c.id)).size, 160);

// ---- packsToDeck 合成 ----
const deck = packsToDeck([STANDARD_PACK, EX_PACK]);
check('packsToDeck 合成张数', deck.cards.length, 108);
check('packsToDeck 名称', deck.name, '标准版+EX');

console.log(failed === 0 ? '\n全部通过 ✅' : `\n${failed} 项失败 ❌`);
process.exit(failed === 0 ? 0 : 1);
