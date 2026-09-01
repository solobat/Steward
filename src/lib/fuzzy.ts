/**
 * 模糊匹配：子序列打分 + 连续/词边界加分 + 中文拼音匹配。
 * 支持：
 * - "ta" 匹配 "tab"、"淘宝"
 * - "tb" 匹配 "淘宝"（拼音首字母）
 * - "taobao" 匹配 "淘宝网"（全拼音）
 * - "淘宝" 直接匹配 "淘宝网"（CJK 子串）
 * 拼音表通过 ensurePinyin() 懒加载（独立 chunk，减小主包）。
 */

/** 汉字 → 拼音（懒加载；未加载时不进行拼音匹配） */
let PINYIN: Record<string, string> | null = null;
let pinyinPromise: Promise<void> | null = null;

export function ensurePinyin(): Promise<void> {
  if (!pinyinPromise) {
    pinyinPromise = import("./pinyinData")
      .then((m) => {
        PINYIN = m.PINYIN_MAP;
      })
      .catch(() => {});
  }
  return pinyinPromise;
}

/** 汉字 → 拼音（每个字符取首读音；非汉字原样小写返回） */
export function toPinyin(text: string): string {
  if (!PINYIN) return text.toLowerCase();
  let out = "";
  for (const ch of text) {
    const py = PINYIN[ch];
    if (py) {
      out += py;
    } else {
      out += ch.toLowerCase();
    }
  }
  return out;
}

function isWordBoundary(text: string, i: number): boolean {
  if (i === 0) return true;
  const prev = text[i - 1];
  return !/[a-z0-9\u4e00-\u9fa5]/.test(prev);
}

/**
 * 子序列打分：query 的每个字符按顺序在 text 中找到即匹配。
 * 加分：连续命中、词边界命中、开头命中；未完全命中返回 0。
 */
export function subseqScore(query: string, text: string): number {
  if (!query) return 0;
  if (text.length < query.length) return 0;
  if (text.startsWith(query)) return 20 + query.length * 2;

  let qi = 0;
  let score = 0;
  let streak = 0;
  let prevMatch = -2;
  const ql = query.length;
  const tl = text.length;
  for (let i = 0; i < tl && qi < ql; i++) {
    if (text[i] === query[qi]) {
      if (i === prevMatch + 1) {
        // 连续命中
        streak++;
        score += 4 + streak;
      } else {
        streak = 1;
        score += 2;
      }
      if (isWordBoundary(text, i)) score += 6;
      prevMatch = i;
      qi++;
    }
  }
  return qi === ql ? score : 0;
}

/** 是否纯拉丁查询（可走拼音匹配） */
function isLatinQuery(q: string): boolean {
  return /^[a-z0-9\s-]*$/i.test(q);
}

/** 综合打分：直接子序列 + 拼音子序列（取高分），不匹配返回 0 */
export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  const s = text.toLowerCase();
  if (!q) return 0;
  let best = subseqScore(q, s);
  if (isLatinQuery(q) && /[\u4e00-\u9fa5]/.test(s)) {
    const py = toPinyin(s);
    const pyScore = subseqScore(q, py);
    if (pyScore > best) best = pyScore;
  }
  return best;
}

/** 对列表按匹配度排序（稳定，保留原顺序），不匹配的剔除 */
export function fuzzyRank<T>(
  items: T[],
  query: string,
  getText: (item: T) => string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const scored: { item: T; score: number; index: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    const score = fuzzyScore(q, getText(items[i]));
    if (score > 0) scored.push({ item: items[i], score, index: i });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((x) => x.item);
}

/** 是否匹配（供 filter 场景使用） */
export function fuzzyMatch(query: string, text: string): boolean {
  return fuzzyScore(query, text) > 0;
}
