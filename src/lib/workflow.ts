import type { ParsedWorkflowLine, WorkflowLineNumbers } from "@/types/workflow";

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

/**
 * 解析工作流正文（类 bash）：
 * - command [filter] -- 选择 [shift]，选择为 1、1-5、all 或 *
 * - 同行多步用 ; 分隔，行末 # 注释，空行忽略
 */
export function parseWorkflow(content: string): ParsedWorkflowLine[] {
  const lines = content.split(/\r?\n/);
  const result: ParsedWorkflowLine[] = [];
  for (const line of lines) {
    const steps = line.split(";").map((s) => s.trim());
    for (const step of steps) {
      const parsed = parseStep(step);
      if (parsed && parsed.input) result.push(parsed);
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
