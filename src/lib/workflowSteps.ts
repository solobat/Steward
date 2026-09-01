/**
 * 工作流步骤的「可视化编辑」模型：
 * 把正文解析成结构化步骤（不展开 repeat，保留用户书写形态），编辑后序列化回正文。
 * 与 lib/workflow.ts 的运行时解析（parseWorkflow，会展开循环）互补。
 */

export type VisualStep =
  | { kind: "command"; command: string; filter: string; selection: string; shift: boolean; alt: boolean }
  | { kind: "wait"; value: string }
  | { kind: "focus"; index: string }
  | { kind: "repeat"; count: string }
  | { kind: "end" }
  | { kind: "set"; key: string; value: string }
  | { kind: "if"; left: string; op: string; right: string }
  | { kind: "copy"; text: string }
  | { kind: "note"; text: string }
  | { kind: "raw"; text: string };

/** 解析一行/一步为结构化步骤；无法识别的归为 raw */
export function classifyStep(input: string): VisualStep {
  const s = input.trim();
  const waitM = s.match(/^wait\s+(.+)$/i);
  if (waitM) return { kind: "wait", value: waitM[1].trim() };
  const focusM = s.match(/^(?:window|focus)\s+(\d+)/i);
  if (focusM) return { kind: "focus", index: focusM[1] };
  const repeatM = s.match(/^repeat\s+(\d+)/i);
  if (repeatM) return { kind: "repeat", count: repeatM[1] };
  if (/^end$/i.test(s)) return { kind: "end" };
  const setM = s.match(/^set\s+([^=]+?)\s*=\s*(.*)$/i);
  if (setM && !/^set\s+\S+\s*==/.test(s)) return { kind: "set", key: setM[1].trim(), value: setM[2].trim() };
  const ifM = s.match(/^if\s+(.+)$/i);
  if (ifM) {
    const cond = ifM[1].trim();
    const cm = cond.match(/^(.+?)\s*(==|!=|contains|>|<|empty)\s*(.*)$/i);
    if (cm) {
      const op = cm[2].toLowerCase();
      return { kind: "if", left: cm[1].trim(), op, right: op === "empty" ? "" : cm[3].trim() };
    }
    return { kind: "raw", text: s };
  }
  const copyM = s.match(/^copy\s+(.*)$/i);
  if (copyM) return { kind: "copy", text: copyM[1].trim() };
  const noteM = s.match(/^note\+\s+(.*)$/i);
  if (noteM) return { kind: "note", text: noteM[1].trim() };

  // 普通命令：command filter -- 选择 [shift] [alt]
  const dashIdx = s.indexOf(" -- ");
  const left = (dashIdx === -1 ? s : s.slice(0, dashIdx)).trim();
  const right = dashIdx === -1 ? "" : s.slice(dashIdx + 4).trim();
  const tokens = left.split(/\s+/).filter(Boolean);
  if (!tokens.length) return { kind: "raw", text: s };
  let selection = "";
  let shift = false;
  let alt = false;
  for (const t of right.split(/\s+/).filter(Boolean)) {
    const tl = t.toLowerCase();
    if (tl === "shift") shift = true;
    else if (tl === "alt") alt = true;
    else if (!selection) selection = t;
  }
  return {
    kind: "command",
    command: tokens[0],
    filter: tokens.slice(1).join(" "),
    selection,
    shift,
    alt,
  };
}

/** 解析正文为步骤列表（空行/注释忽略；" ; " 分隔多步） */
export function parseWorkflowSteps(content: string): VisualStep[] {
  const steps: VisualStep[] = [];
  for (const line of content.split(/\r?\n/)) {
    for (const seg of line.split(";")) {
      const s = seg.replace(/#.*$/, "").trim();
      if (!s) continue;
      steps.push(classifyStep(s));
    }
  }
  return steps;
}

function stepToLine(step: VisualStep): string {
  switch (step.kind) {
    case "command": {
      let line = step.command.trim();
      if (step.filter.trim()) line += ` ${step.filter.trim()}`;
      const opts = [step.selection.trim(), step.shift ? "shift" : "", step.alt ? "alt" : ""]
        .filter(Boolean)
        .join(" ");
      if (opts) line += ` -- ${opts}`;
      return line;
    }
    case "wait":
      return `wait ${step.value.trim()}`;
    case "focus":
      return `window ${step.index.trim()}`;
    case "repeat":
      return `repeat ${step.count.trim()}`;
    case "end":
      return "end";
    case "set":
      return `set ${step.key.trim()}=${step.value}`;
    case "if": {
      if (step.op === "empty") return `if ${step.left.trim()} empty`;
      return `if ${step.left.trim()} ${step.op} ${step.right}`;
    }
    case "copy":
      return `copy ${step.text}`;
    case "note":
      return `note+ ${step.text}`;
    case "raw":
      return step.text;
    default:
      return "";
  }
}

/** 步骤列表序列化回正文 */
export function stepsToContent(steps: VisualStep[]): string {
  return steps.map(stepToLine).filter((l) => l.trim()).join("\n");
}

/** 常用命令键位（供编辑器输入提示） */
export const COMMAND_KEYS = [
  "tab",
  "tabc",
  "tabm",
  "tabp",
  "his",
  "bm",
  "top",
  "dl",
  "ext",
  "undo",
  "calc",
  "search",
  "url",
  "note",
  "txt",
  "tr",
  "ai",
  "wf",
  "bk",
  "bk8",
  "bks",
  "opt",
  "close",
  "mute",
];
