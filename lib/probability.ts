/**
 * 概率计算引擎
 *
 * 核心模型:不放回抽取 -> 超几何分布;放回抽取/逐张查看 -> 二项分布。
 * 所有函数为纯函数,可单元测试,可在 RN/Hermes 上直接运行。
 */

/** 安全计算组合数 C(n, k),使用乘法累乘避免阶乘溢出,保持整数精度 */
export function combinations(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k)) {
    throw new Error('combinations: n 和 k 必须为整数');
  }
  if (k < 0 || n < 0 || k > n) return 0;
  // 利用对称性减少乘法次数: C(n, k) = C(n, n - k)
  const kk = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= kk; i++) {
    result = (result * (n - kk + i)) / i;
  }
  return Math.round(result);
}

/**
 * 超几何分布概率(不放回抽取)
 * 从 N 张牌中抽取 n 张,其中包含恰好 m 张目标牌的概率。
 * P(X = m) = C(K, m) * C(N - K, n - m) / C(N, n)
 *
 * @param poolSize    牌库总张数 N
 * @param targetCount 目标牌张数 K
 * @param draws       抽取张数 n
 * @param hits        命中目标牌张数 m
 */
export function hypergeometricPMF(
  poolSize: number,
  targetCount: number,
  draws: number,
  hits: number,
): number {
  validateDrawParams(poolSize, targetCount, draws);
  if (!Number.isInteger(hits) || hits < 0) {
    throw new Error('hits 必须为非负整数');
  }
  if (hits > targetCount || hits > draws || draws - hits > poolSize - targetCount) {
    return 0; // 不可能事件
  }
  return (
    (combinations(targetCount, hits) * combinations(poolSize - targetCount, draws - hits)) /
    combinations(poolSize, draws)
  );
}

/**
 * 超几何分布累积概率:抽到「至少 minHits 张」目标牌的概率
 */
export function hypergeometricAtLeast(
  poolSize: number,
  targetCount: number,
  draws: number,
  minHits: number,
): number {
  validateDrawParams(poolSize, targetCount, draws);
  if (!Number.isInteger(minHits) || minHits < 0) {
    throw new Error('minHits 必须为非负整数');
  }
  const upper = Math.min(draws, targetCount);
  if (minHits > upper) return 0;
  let sum = 0;
  for (let m = minHits; m <= upper; m++) {
    sum += hypergeometricPMF(poolSize, targetCount, draws, m);
  }
  // 修正浮点累加误差,并夹取到 [0, 1]
  return Math.min(1, Math.max(0, sum));
}

/**
 * 二项分布概率(放回抽取 / 逐张查看 n 张面朝上的牌)
 * 单次命中率 p,重复 n 次,恰好命中 m 次的概率。
 */
export function binomialPMF(trials: number, probability: number, hits: number): number {
  validateBinomialParams(trials, probability);
  if (!Number.isInteger(hits) || hits < 0 || hits > trials) return 0;
  const p = probability;
  return combinations(trials, hits) * Math.pow(p, hits) * Math.pow(1 - p, trials - hits);
}

/**
 * 二项分布累积概率:至少命中 minHits 次的概率
 */
export function binomialAtLeast(trials: number, probability: number, minHits: number): number {
  validateBinomialParams(trials, probability);
  if (!Number.isInteger(minHits) || minHits < 0) return 0;
  if (minHits > trials) return 0;
  let sum = 0;
  for (let m = minHits; m <= trials; m++) {
    sum += binomialPMF(trials, probability, m);
  }
  return Math.min(1, Math.max(0, sum));
}

/** 期望命中张数:超几何分布的期望 = n * K / N */
export function hypergeometricMean(poolSize: number, targetCount: number, draws: number): number {
  validateDrawParams(poolSize, targetCount, draws);
  return (draws * targetCount) / poolSize;
}

function validateDrawParams(poolSize: number, targetCount: number, draws: number): void {
  if (!Number.isInteger(poolSize) || poolSize <= 0) {
    throw new Error('牌库总张数必须为正整数');
  }
  if (!Number.isInteger(targetCount) || targetCount < 0 || targetCount > poolSize) {
    throw new Error('目标牌张数必须在 [0, 牌库总张数] 内');
  }
  if (!Number.isInteger(draws) || draws < 0 || draws > poolSize) {
    throw new Error('抽取张数必须在 [0, 牌库总张数] 内');
  }
}

function validateBinomialParams(trials: number, probability: number): void {
  if (!Number.isInteger(trials) || trials < 0) {
    throw new Error('试验次数必须为非负整数');
  }
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new Error('单次概率必须在 [0, 1] 内');
  }
}

/** 概率格式化:0.1234 -> "12.34%" */
export function formatPercent(p: number, digits = 2): string {
  return `${(p * 100).toFixed(digits)}%`;
}
