import { test, run, assert } from "./helpers";
import { fuzzyScore, fuzzyRank, toPinyin, ensurePinyin, subseqScore } from "../src/lib/fuzzy";

test("subseqScore 基础", () => {
  assert.ok(subseqScore("tab", "tab") > 0);
  assert.ok(subseqScore("ta", "tab") > 0);
  assert.ok(subseqScore("tb", "tab") > 0, "子序列 tb 应匹配 tab");
  assert.strictEqual(subseqScore("abc", "xyz"), 0);
});

test("fuzzyScore 大小写不敏感", () => {
  assert.ok(fuzzyScore("book", "Bookmarks") > 0);
  assert.ok(fuzzyScore("TAB", "tab") > 0);
});

test("fuzzyScore 开头加分 > 子序列", () => {
  assert.ok(subseqScore("tab", "tabc") > subseqScore("tab", "xtabc"));
});

test("中文拼音匹配（加载拼音表后）", async () => {
  await ensurePinyin();
  assert.ok(fuzzyScore("taobao", "淘宝网") > 0, "全拼音匹配");
  assert.ok(fuzzyScore("tb", "淘宝网") > 0, "拼音首字母子序列");
  assert.ok(fuzzyScore("淘宝", "淘宝网") > 0, "中文直接匹配");
  assert.strictEqual(fuzzyScore("qq", "淘宝网"), 0, "不相关拼音不匹配");
  assert.ok(toPinyin("淘宝网") === "taobaowang", "拼音转换");
});

test("fuzzyRank 排序稳定", () => {
  const items = ["tab", "tabc", "xtab", "other"];
  const ranked = fuzzyRank(items, "tab", (s) => s);
  assert.strictEqual(ranked[0], "tab", "完全匹配优先");
  assert.ok(ranked.includes("tabc"));
  assert.ok(!ranked.includes("other"));
});

run();
