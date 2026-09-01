import { test, run, assert } from "./helpers";
import {
  parseWorkflow,
  substituteVars,
  evaluateCondition,
  parseSetLine,
  buildBuiltinVars,
  isWaitStep,
  parseWaitMs,
} from "../src/lib/workflow";

test("repeat 展开与 {{i}}", () => {
  const lines = parseWorkflow("repeat 3\n  url https://example.com/{{i}}\nend");
  assert.strictEqual(lines.length, 3);
  assert.strictEqual(lines[0].iteration, 1);
  assert.strictEqual(lines[2].iteration, 3);
  assert.strictEqual(lines[0].input, "url https://example.com/{{i}}");
});

test("if/end 配对与跳转", () => {
  const lines = parseWorkflow("if {{a}} == 1\n  copy yes\nend\ncopy after");
  assert.strictEqual(lines.length, 4);
  const ifLine = lines[0];
  assert.strictEqual(ifLine.control, "if");
  assert.strictEqual(ifLine.ifSkipTo, 2, "假时跳到 end 行");
  assert.strictEqual(lines[1].control, "copy");
  assert.strictEqual(lines[2].control, "end");
  assert.strictEqual(lines[3].input, "copy after");
});

test("无 end 的 if 不重复", () => {
  const lines = parseWorkflow("if 1 == 2\n  copy x\n");
  assert.strictEqual(lines.length, 2);
  assert.strictEqual(lines[0].control, "if");
  assert.strictEqual(lines[1].control, "copy");
});

test("set / copy / note+ 标记为控制行", () => {
  const lines = parseWorkflow("set name=淘宝\ncopy 你好 {{name}}\nnote+ 记录 {{name}}");
  assert.strictEqual(lines[0].control, "set");
  assert.strictEqual(lines[1].control, "copy");
  assert.strictEqual(lines[2].control, "note");
});

test("变量替换", () => {
  const vars = buildBuiltinVars("剪贴板内容");
  vars.name = "淘宝";
  assert.strictEqual(substituteVars("tab {{name}} {{i}}", vars, 2), "tab 淘宝 2");
  assert.strictEqual(substituteVars("copy {{clipboard}} {{date}}", vars), `copy 剪贴板内容 ${vars.date}`);
  assert.strictEqual(substituteVars("无变量", vars), "无变量");
  assert.strictEqual(substituteVars("{{missing}}", vars), "");
});

test("条件求值", () => {
  const vars = buildBuiltinVars("苹果 香蕉");
  vars.n = "3";
  assert.strictEqual(evaluateCondition({ left: "{{clipboard}}", op: "contains", right: "苹果" }, vars), true);
  assert.strictEqual(evaluateCondition({ left: "{{clipboard}}", op: "contains", right: "西瓜" }, vars), false);
  assert.strictEqual(evaluateCondition({ left: "{{n}}", op: ">", right: "2" }, vars), true);
  assert.strictEqual(evaluateCondition({ left: "{{n}}", op: "<", right: "2" }, vars), false);
  assert.strictEqual(evaluateCondition({ left: "{{clipboard}}", op: "empty", right: "" }, vars), false);
  assert.strictEqual(evaluateCondition({ left: "{{missing}}", op: "empty", right: "" }, vars), true);
  assert.strictEqual(evaluateCondition({ left: "{{n}}", op: "==", right: "3" }, vars), true);
});

test("set 行解析", () => {
  assert.deepStrictEqual(parseSetLine("set key = value with spaces"), ["key", "value with spaces"]);
  assert.deepStrictEqual(parseSetLine("set a=1"), ["a", "1"]);
  assert.strictEqual(parseSetLine("tab 淘宝"), null);
});

test("wait 解析", () => {
  assert.ok(isWaitStep("wait 0.5"));
  assert.strictEqual(parseWaitMs("wait 5"), 5000);
  assert.strictEqual(parseWaitMs("wait 500"), 500);
  assert.strictEqual(parseWaitMs("wait 0.5"), 500);
  assert.strictEqual(parseWaitMs("wait 2s"), 2000);
});

run();
