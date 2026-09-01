import type { ParsedWorkflowLine, WorkflowLineCondition, WorkflowLineNumbers } from "@/types/workflow";

/** 选择：单个数字(1-based)、范围 1-n、全选(all 或 *) */
const SELECTION_REG = /^(?:(\d+)-(\d+)|(\d+)|all|\*)$/i;

function parseSelection(token: string): WorkflowLineNumbers | undefined {
  const s = token.trim();
  if (!s) return undefined;
  const m = s.match(SELECTION_REG);
  if (!m) return undefined;
  if (m[1] !== undefined) {
    const a = Math.min(+m[1], +m[2]);
    const b = Math.max(+m[1], +m[2]);
    return [String(a), String(b)];
  }
  if (m[3] !== undefined) return Number(m[3]) || undefined;
  return -1; // all | *
}

/** 解析一步：command [filter] [-- 选择 [shift] [alt]]，无 -- 时默认选第 1 条 */
function parseStep(step: string): ParsedWorkflowLine | null {
  const trimmed = step.trim();
  if (!trimmed) return null;
  const withoutComment = trimmed.replace(/#.*$/, "").trim();
  if (!withoutComment) return null;

  const dashDash = " -- ";
  const idx = withoutComment.indexOf(dashDash);
  if (idx === -1) {
    return { input: withoutComment };
  }
  const left = withoutComment.slice(0, idx).trim();
  const right = withoutComment.slice(idx + dashDash.length).trim();
  if (!left) return null;
  let numbers: WorkflowLineNumbers | undefined;
  let withShift = false;
  let withAlt = false;
  if (right) {
    const tokens = right.split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      if (t.toLowerCase() === "shift") withShift = true;
      else if (t.toLowerCase() === "alt") withAlt = true;
      else if (numbers === undefined) numbers = parseSelection(t);
    }
  }
  return { input: left, numbers, withShift, withAlt };
}

/** 解析 if 条件：{{var}} == value / != / contains / > / < / empty */
function parseCondition(raw: string): WorkflowLineCondition | null {
  const s = raw.trim();
  const m = s.match(/^(.+?)\s*(==|!=|contains|>|<|empty)\s*(.*)$/i);
  if (!m) return null;
  const op = m[2].toLowerCase();
  return { left: m[1].trim(), op, right: op === "empty" ? "" : m[3].trim() };
}

const REPEAT_REG = /^repeat\s+(\d+)$/i;
const END_REG = /^end$/i;

/**
 * 解析工作流正文（类 bash）：
 * - command [filter] -- 选择 [shift]，选择为 1、1-5、all 或 *
 * - 同行多步用 ; 分隔，行末 # 注释，空行忽略
 * - 变量：set key=value 设置，{{key}} 替换；内置 {{clipboard}} {{date}} {{time}} {{i}}
 * - 循环：repeat N ... end（{{i}} 为 1-based 迭代号，仅支持单层）
 * - 条件：if <左值> <op> <右值> ... end，op: == != contains > < empty
 * - 控制步骤：copy <文本>（复制）、note+ <文本>（保存笔记）
 */
export function parseWorkflow(content: string): ParsedWorkflowLine[] {
  const flat: ParsedWorkflowLine[] = [];
  for (const line of content.split(/\r?\n/)) {
    const steps = line.split(";").map((s) => s.trim());
    for (const step of steps) {
      const parsed = parseStep(step);
      if (parsed && parsed.input) flat.push(parsed);
    }
  }

  // pass 1: repeat N ... end 展开（{{i}} 迭代）
  let lines: ParsedWorkflowLine[] = [];
  let i = 0;
  while (i < flat.length) {
    const cur = flat[i];
    const rm = cur.input.trim().match(REPEAT_REG);
    if (rm) {
      const count = Math.min(Math.max(parseInt(rm[1], 10) || 0, 0), 100);
      const body: ParsedWorkflowLine[] = [];
      let endIdx = -1;
      let j = i + 1;
      while (j < flat.length) {
        if (END_REG.test(flat[j].input.trim())) {
          endIdx = j;
          break;
        }
        body.push(flat[j]);
        j++;
      }
      if (endIdx !== -1) {
        for (let iter = 1; iter <= count; iter++) {
          for (const b of body) {
            lines.push({ ...b, iteration: iter });
          }
        }
        i = endIdx + 1;
        continue;
      }
      // 没有匹配的 end：忽略 repeat 行本身
      i += 1;
      continue;
    }
    lines.push(cur);
    i++;
  }

  // pass 2: if <cond> ... end 配对
  const result: ParsedWorkflowLine[] = [];
  i = 0;
  while (i < lines.length) {
    const cur = lines[i];
    const im = cur.input.trim().match(/^if\s+(.+)$/i);
    if (im) {
      const condition = parseCondition(im[1]);
      if (condition) {
        let endIdx = -1;
        let j = i + 1;
        while (j < lines.length) {
          if (END_REG.test(lines[j].input.trim())) {
            endIdx = j;
            break;
          }
          j++;
        }
        result.push({ ...cur, control: "if", condition, ifSkipTo: endIdx });
        if (endIdx !== -1) {
          for (let k = i + 1; k < endIdx; k++) result.push(lines[k]);
          result.push({ input: "end", control: "end" });
          i = endIdx + 1;
        } else {
          i += 1;
        }
        continue;
      }
    }
    result.push(cur);
    i++;
  }

  // pass 3: 标记控制行（set / copy / note+ / 残留的 end）
  for (const line of result) {
    if (line.control) continue;
    const t = line.input.trim();
    if (END_REG.test(t)) {
      line.control = "end";
    } else if (/^set\s+\S+=/i.test(t) && !t.includes("==")) {
      line.control = "set";
    } else if (/^copy\s+/i.test(t)) {
      line.control = "copy";
    } else if (/^note\+\s+/i.test(t)) {
      line.control = "note";
    }
  }
  return result;
}

/** 1-based 转 0-based，非法或 ≤0 返回 0 */
export function fixNumber(str: string | number): number {
  const n = typeof str === "string" ? Number(str) : str;
  if (n <= 0 || !Number.isFinite(n)) return 0;
  return n - 1;
}

// ---------- 预定义步骤类型：等待、聚焦窗口（无选择，直接推进） ----------

/** 是否「等待」步骤：wait 500（毫秒）或 wait 0.5（秒） */
export function isWaitStep(input: string): boolean {
  return /^wait\s+/i.test(input.trim());
}

/** 解析等待时长，返回毫秒。支持 "wait 5"（秒）、"wait 500"（毫秒）、"wait 0.5"、"wait 1s" */
export function parseWaitMs(input: string): number {
  const s = input.trim().replace(/^wait\s+/i, "").trim();
  const num = Number(s.replace(/s$/i, ""));
  if (!Number.isFinite(num) || num < 0) return 0;
  if (/s$/i.test(s)) return Math.round(num * 1000);
  if (num !== Math.floor(num)) return Math.round(num * 1000);
  return num >= 100 ? Math.round(num) : Math.round(num) * 1000;
}

/** 是否「聚焦窗口」步骤：window 2 或 focus 2（1-based 窗口序号） */
export function isFocusWindowStep(input: string): boolean {
  return /^(window|focus)\s+\d+/i.test(input.trim());
}

/** 解析聚焦窗口序号（1-based） */
export function parseFocusWindowIndex(input: string): number {
  const m = input.trim().match(/^(?:window|focus)\s+(\d+)/i);
  return m ? Math.max(1, parseInt(m[1], 10)) : 1;
}

// ---------- 变量 ----------

/** 替换 {{name}}；{{i}} 取迭代号；未定义的变量替换为空串 */
export function substituteVars(input: string, vars: Record<string, string>, iteration?: number): string {
  if (!input.includes("{{")) return input;
  return input.replace(/\{\{([^}]+)\}\}/g, (_m, raw: string) => {
    const key = raw.trim();
    if (key === "i" && iteration !== undefined) return String(iteration);
    return vars[key] ?? "";
  });
}

/** 工作流启动时的内置变量 */
export function buildBuiltinVars(clipboard: string): Record<string, string> {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    clipboard: clipboard ?? "",
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** 求值 if 条件（左右值先做变量替换） */
export function evaluateCondition(
  cond: WorkflowLineCondition,
  vars: Record<string, string>,
  iteration?: number
): boolean {
  const l = substituteVars(cond.left, vars, iteration);
  const r = substituteVars(cond.right, vars, iteration);
  switch (cond.op) {
    case "==":
      return l === r;
    case "!=":
      return l !== r;
    case "contains":
      return l.includes(r);
    case ">":
      return Number(l) > Number(r);
    case "<":
      return Number(l) < Number(r);
    case "empty":
      return l.trim() === "";
    default:
      return true;
  }
}

/** 解析 set 行：set key=value，返回 [key, value] */
export function parseSetLine(input: string): [string, string] | null {
  const m = input.trim().match(/^set\s+([^=]+?)\s*=\s*(.*)$/i);
  if (!m) return null;
  const key = m[1].trim();
  return key ? [key, m[2].trim()] : null;
}
