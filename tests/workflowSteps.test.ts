import { test, run, assert } from "./helpers";
import { classifyStep, parseWorkflowSteps, stepsToContent } from "../src/lib/workflowSteps";

test("命令步骤解析", () => {
  const s = classifyStep("tab 淘宝 -- 2 shift");
  assert.strictEqual(s.kind, "command");
  if (s.kind === "command") {
    assert.strictEqual(s.command, "tab");
    assert.strictEqual(s.filter, "淘宝");
    assert.strictEqual(s.selection, "2");
    assert.strictEqual(s.shift, true);
    assert.strictEqual(s.alt, false);
  }
});

test("控制步骤解析", () => {
  assert.strictEqual(classifyStep("wait 0.5").kind, "wait");
  assert.strictEqual(classifyStep("window 2").kind, "focus");
  assert.strictEqual(classifyStep("repeat 3").kind, "repeat");
  assert.strictEqual(classifyStep("end").kind, "end");
  const set = classifyStep("set name=淘宝");
  assert.strictEqual(set.kind, "set");
  if (set.kind === "set") {
    assert.strictEqual(set.key, "name");
    assert.strictEqual(set.value, "淘宝");
  }
  const ifs = classifyStep("if {{clipboard}} contains 苹果");
  assert.strictEqual(ifs.kind, "if");
  if (ifs.kind === "if") {
    assert.strictEqual(ifs.op, "contains");
    assert.strictEqual(ifs.right, "苹果");
  }
  assert.strictEqual(classifyStep("copy 你好").kind, "copy");
  assert.strictEqual(classifyStep("note+ 记录").kind, "note");
});

test("序列化回正文（roundtrip）", () => {
  const content = [
    "set name=淘宝",
    "tab {{name}} -- 1",
    "wait 0.5",
    "repeat 2",
    "url https://example.com/{{i}}",
    "end",
    "if {{name}} contains 淘宝",
    "copy 结果: {{name}}",
    "end",
  ].join("\n");
  const steps = parseWorkflowSteps(content);
  assert.strictEqual(steps.length, 9);
  const back = stepsToContent(steps);
  // 除注释/空行外应能还原语义（命令行的 -- 1 会被规范化）
  assert.ok(back.includes("set name=淘宝"));
  assert.ok(back.includes("tab {{name}} -- 1"));
  assert.ok(back.includes("repeat 2"));
  assert.ok(back.includes("if {{name}} contains 淘宝"));
  // 重新解析结果一致（幂等）
  const again = parseWorkflowSteps(back);
  assert.strictEqual(again.length, steps.length);
});

test("注释与空行忽略", () => {
  const steps = parseWorkflowSteps("# 注释\n\ntab 淘宝 # 行尾注释\n; wait 0.5");
  assert.strictEqual(steps.length, 2);
  assert.strictEqual(steps[0].kind, "command");
  assert.strictEqual(steps[1].kind, "wait");
});

run();
