import { test, run, assert } from "./helpers";

// 先注入 chrome stub：getExchangeRates 返回 null → 走静态兜底表（确定性）
const listeners: ((m: { id?: number; result?: unknown }) => void)[] = [];
(globalThis as Record<string, unknown>).chrome = {
  runtime: {
    connect: () => ({
      name: "steward",
      onMessage: { addListener: (fn: (m: never) => void) => listeners.push(fn) },
      onDisconnect: { addListener: () => {} },
      postMessage: (msg: { action?: string; id?: number }) => {
        setTimeout(() => {
          const result = msg.action === "getExchangeRates" ? null : undefined;
          listeners.forEach((fn) => fn({ id: msg.id, result }));
        }, 0);
      },
      disconnect: () => {},
    }),
  },
  storage: { local: { get: (_k: unknown, cb?: (r: Record<string, never>) => void) => cb?.({}), set: () => {} } },
};

import { convertUnit, isConversionExpression, formatNumber } from "../src/commands/calculate/conversions";

test("长度换算", async () => {
  const r = await convertUnit("5ft in cm");
  assert.ok(r);
  assert.strictEqual(r.value, "152.4");
  const r2 = await convertUnit("1 公里 to 米");
  assert.ok(r2);
  assert.strictEqual(r2.value, "1000");
});

test("温度换算", async () => {
  const r = await convertUnit("32c in f");
  assert.ok(r);
  assert.strictEqual(r.value, "89.6");
  const r2 = await convertUnit("212 f to c");
  assert.ok(r2);
  assert.strictEqual(r2.value, "100");
});

test("货币换算（静态兜底）", async () => {
  const r = await convertUnit("100 usd to cny");
  assert.ok(r, "应识别货币换算");
  assert.strictEqual(r.value, "725");
  assert.ok(r.desc.includes("参考汇率"), "离线时标注参考汇率");
  const r2 = await convertUnit("500g in 斤");
  assert.ok(r2);
  assert.strictEqual(r2.value, "1");
});

test("非法表达式返回 null", async () => {
  assert.strictEqual(await convertUnit("hello world"), null);
  assert.strictEqual(await convertUnit("5ft in kg"), null, "跨类别不允许");
});

test("isConversionExpression 同步判定", () => {
  assert.ok(isConversionExpression("5ft in cm"));
  assert.ok(isConversionExpression("100 usd to cny"));
  assert.ok(!isConversionExpression("1+2*3"));
});

test("formatNumber 无浮点噪音", () => {
  assert.strictEqual(formatNumber(725.0000001), "725");
  assert.strictEqual(formatNumber(13.793103), "13.793103");
});

run();
