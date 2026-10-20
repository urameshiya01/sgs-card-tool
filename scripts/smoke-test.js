/**
 * 冒烟测试:用 TypeScript 编译器 API 将核心模块转译为 JS 后在 Node 中运行。
 * 用法: node scripts/smoke-test.js
 *
 * 注意:数据文件使用 "@/" 别名导入,这里先用简单字符串替换降级为相对路径。
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
  'lib/deckBuilder.ts',
  'data/decks/standard.ts',
  'data/decks/junzheng.ts',
  'data/decks/guozhan.ts',
  'data/index.ts',
];

function toJs(file) {
  const src = fs.readFileSync(file, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  // 把别名导入改写为相对输出目录的 require
  const rewritten = js
    .replace(/require\("@\/data\/decks\/(\w+)"\)/g, 'require("./data/decks/$1.js")')
    .replace(/require\("@\/data"\)/g, 'require("./data/index.js")')
    .replace(/require\("@\/lib\/(\w+)"\)/g, 'require("./lib/$1.js")')
    .replace(/require\("\.\.\/\.\.\/lib\/(\w+)"\)/g, 'require("../../lib/$1.js")')
    .replace(/require\("\.\.\/lib\/(\w+)"\)/g, 'require("../lib/$1.js")')
    .replace(/require\("\.\/cards"\)/g, 'require("../../lib/cards.js")')
    .replace(/require\("\.\/decks"\)/g, 'require("../../lib/decks.js")')
    .replace(/require\("\.\/deckBuilder"\)/g, 'require("../../lib/deckBuilder.js")');
  const outPath = path.join(outDir, file.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, rewritten);
}

files.forEach(toJs);

const { DECKS, STANDARD_DECK, JUNZHENG_DECK, GUOZhan_DECK } = require(path.join(outDir, 'data/index.js'));
const { countByKind, countBySuit, filterCards } = require(path.join(outDir, 'lib/cards.js'));
const {
  combinations,
  hypergeometricPMF,
  hypergeometricAtLeast,
  binomialPMF,
  binomialAtLeast,
} = require(path.join(outDir, 'lib/probability.js'));

let failed = 0;
function check(name, actual, expected, tol = 0) {
  const ok =
    typeof expected === 'number' && tol > 0
      ? Math.abs(actual - expected) <= tol
      : actual === expected;
  if (!ok) {
    failed++;
    console.error(`✗ ${name}: 期望 ${expected},实际 ${actual}`);
  } else {
    console.log(`✓ ${name} = ${actual}`);
  }
}

// ---- 组合数与分布(引擎不变,抽查) ----
check('C(52,5)', combinations(52, 5), 2598960);
check('C(160,4)', combinations(160, 4), 26294360);
{
  const N = 108, K = 30, n = 4;
  const pNone = combinations(N - K, n) / combinations(N, n);
  check('P(108牌库抽4至少1杀)', hypergeometricAtLeast(N, K, n, 1), 1 - pNone, 1e-12);
  let sum = 0;
  for (let m = 0; m <= n; m++) sum += hypergeometricPMF(N, K, n, m);
  check('PMF 全分布求和 = 1', sum, 1, 1e-12);
}
check('B(10,0.5,≥5)', binomialAtLeast(10, 0.5, 5), 0.623046875, 1e-12);

// ---- 三套牌库总体校验 ----
function deckChecks(deck, expect) {
  console.log(`\n—— 牌库「${deck.name}」——`);
  check('总张数', deck.cards.length, expect.total);
  const suits = countBySuit(deck.cards);
  check(
    '花色分布',
    JSON.stringify(suits),
    JSON.stringify(expect.suits),
  );
  const kinds = countByKind(deck.cards);
  check('类型分布', JSON.stringify(kinds), JSON.stringify(expect.kinds));
  for (const [name, count] of Object.entries(expect.names)) {
    check(`「${name}」张数`, filterCards(deck.cards, { name }).length, count);
  }
  check('无重复 id', new Set(deck.cards.map((c) => c.id)).size, expect.total);
}

deckChecks(STANDARD_DECK, {
  total: 108,
  suits: { '♠': 27, '♥': 27, '♣': 27, '♦': 27 },
  kinds: { 基本牌: 53, 锦囊牌: 36, 装备牌: 19 },
  names: { 杀: 30, 闪: 15, 桃: 8, 无懈可击: 4, 过河拆桥: 6, 顺手牵羊: 5, 乐不思蜀: 3 },
});

deckChecks(JUNZHENG_DECK, {
  total: 160,
  suits: { '♠': 40, '♥': 40, '♣': 40, '♦': 40 },
  kinds: { 基本牌: 85, 锦囊牌: 50, 装备牌: 25 },
  names: {
    杀: 30, 火杀: 5, 雷杀: 9, 闪: 24, 桃: 12, 酒: 5,
    火攻: 3, 铁索连环: 6, 兵粮寸断: 2, 藤甲: 2, 白银狮子: 1, 朱雀羽扇: 1, 古锭刀: 1, 骅骝: 1,
  },
});

deckChecks(GUOZhan_DECK, {
  total: 108,
  suits: { '♠': 27, '♥': 27, '♣': 27, '♦': 27 },
  kinds: { 基本牌: 54, 锦囊牌: 34, 装备牌: 20 },
  names: {
    杀: 21, 火杀: 3, 雷杀: 5, 闪: 14, 桃: 8, 酒: 3,
    铁索连环: 3, 火攻: 2, 兵粮寸断: 2, 以逸待劳: 2, 知己知彼: 2, 远交近攻: 1,
    '无懈可击·国': 2, 吴六剑: 1, 三尖两刃刀: 1, 青龙偃月刀: 0,
  },
});

// ---- DECKS 注册表 ----
check('DECKS 注册数量', DECKS.length, 3);
check('牌库 id 唯一', new Set(DECKS.map((d) => d.id)).size, DECKS.length);

console.log(failed === 0 ? '\n全部通过 ✅' : `\n${failed} 项失败 ❌`);
process.exit(failed === 0 ? 0 : 1);
