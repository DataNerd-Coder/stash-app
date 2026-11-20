import type { Product } from "../data/types.js";

/* ---------- # product search (client-side fuzzy matching over the real product list) ---------- */

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

const stripVowels = (s: string) => s.replace(/[aeiou]/g, "");

/** Scores how well a query matches a product name; handles typos like "mlk" or "miloo". */
export function fuzzyProductScore(query: string, targetName: string): number {
  const q = query.toLowerCase().trim();
  const t = targetName.toLowerCase();
  if (!q) return -999;
  if (t.includes(q)) return 1000 - t.indexOf(q);
  const qS = stripVowels(q);
  const tS = stripVowels(t);
  if (qS && tS.includes(qS)) return 700 - tS.indexOf(qS);
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  let best = -999;
  for (const w of words) {
    const maxDist = Math.max(2, Math.ceil(q.length / 2));
    const d = levenshtein(q, w);
    if (d <= maxDist) {
      const score = 500 - d * 60 - Math.abs(w.length - q.length) * 5;
      if (score > best) best = score;
    }
  }
  return best;
}

export function searchProducts(products: Product[], query: string, limit = 5): Product[] {
  const q = (query || "").trim();
  if (!q) return [];
  return products
    .map((p) => ({ p, score: fuzzyProductScore(q, p.name) }))
    .filter((x) => x.score > -50)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export const stockLine = (product: Product) => (product.stockUnits === 0 ? "Out of stock" : product.qtyLabel);

/** Expired, or expiring within 7 days. */
export const needsAttention = (p: Product) => p.expired || (p.expiryDays !== null && p.expiryDays <= 7);
