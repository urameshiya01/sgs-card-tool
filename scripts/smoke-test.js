/**
 * 冒烟测试:用 TypeScript 编译器 API 将核心模块转译为 JS 后在 Node 中运行。
 * 用法: node scripts/smoke-test.js
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const os = require('os');

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgs-smoke-'));

const files = ['lib/cards.ts', 'lib/probability.ts', 'data/sgsDeck.ts'];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const outPath = path.join(outDir, file.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, js);
}

const { DECK, DECK_SIZE } = require(path.join(outDir, 'data/sgsDeck.js'));
const { countByKind, countBySuit, filterCards } = require(path.join(outDir, 'lib/cards.js'));
const {
  combinations,
  hypergeometricPMF,
  hypergeometricAtLeast,
  binomialPMF,
  binomialAtLeast,
  formatPercent,
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
    console.log(`✓ ${name} = ${typeof actual === 'number' ? actual : actual}`);
  }
}

// ---- 牌库数据 ----
check('牌库总张数', DECK_SIZE, 108);
check('EX 牌张数', DECK.filter((c) => c.ex).length, 4);
const kinds = countByKind(DECK);
console.log('  类型分布:', JSON.stringify(kinds));
check('基本牌(53)', kinds['基本牌'], 53);
check('锦囊牌(36)', kinds['锦囊牌'], 36);
check('装备牌(19)', kinds['装备牌'], 19);
const suits = countBySuit(DECK);
console.log('  花色分布:', JSON.stringify(suits));
check('每花色各 27 张', ['♠', '♥', '♣', '♦'].every((s) => suits[s] === 27), true);
check('「杀」张数', filterCards(DECK, { name: '杀' }).length, 30);
check('「闪」张数', filterCards(DECK, { name: '闪' }).length, 15);
check('「桃」张数', filterCards(DECK, { name: '桃' }).length, 8);
check('「无懈可击」张数(含EX ♦Q)', filterCards(DECK, { name: '无懈可击' }).length, 4);
check('「过河拆桥」张数', filterCards(DECK, { name: '过河拆桥' }).length, 6);
check('「顺手牵羊」张数', filterCards(DECK, { name: '顺手牵羊' }).length, 5);
check('「乐不思蜀」张数', filterCards(DECK, { name: '乐不思蜀' }).length, 3);
check('红桃牌张数', filterCards(DECK, { suit: '♥' }).length, 27);
check('无重复 id', new Set(DECK.map((c) => c.id)).size, 108);

// ---- 组合数 ----
check('C(52,5)', combinations(52, 5), 2598960);
check('C(108,4)', combinations(108, 4), 5359095);
check('C(10,0)', combinations(10, 0), 1);
check('C(5,7) 越界', combinations(5, 7), 0);

// ---- 超几何分布:108 张牌库、30 张杀、抽 4 张 ----
const N = 108, K = 30, n = 4;
// P(至少1张) = 1 - C(78,4)/C(108,4)
const pNone = combinations(N - K, n) / combinations(N, n);
check('P(抽4张至少1张杀)', hypergeometricAtLeast(N, K, n, 1), 1 - pNone, 1e-12);
console.log(`  → 抽 4 张至少摸到 1 张「杀」: ${formatPercent(hypergeometricAtLeast(N, K, n, 1))}`);
check('P(恰好2张杀)', hypergeometricPMF(N, K, n, 2),
  (combinations(30, 2) * combinations(78, 2)) / combinations(108, 4), 1e-12);
// 全分布求和 = 1
let sum = 0;
for (let m = 0; m <= n; m++) sum += hypergeometricPMF(N, K, n, m);
check('PMF 全分布求和 = 1', sum, 1, 1e-12);
check('不可能事件(m > K)', hypergeometricPMF(N, K, n, 31), 0);
check('期望命中 = n·K/N', (n * K) / N, 1.1111111111111112);

// ---- 二项分布(放回/逐张查看) ----
check('B(10, 0.5, 5)', binomialPMF(10, 0.5, 5), 0.24609375, 1e-12);
check('B(10, 0.5, ≥5)', binomialAtLeast(10, 0.5, 5), 0.623046875, 1e-12);

console.log(failed === 0 ? '\n全部通过 ✅' : `\n${failed} 项失败 ❌`);
process.exit(failed === 0 ? 0 : 1);
