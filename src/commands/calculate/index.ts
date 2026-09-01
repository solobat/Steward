import type { Command, ResultItem } from "../types";
import { convertUnit, isConversionExpression } from "./conversions";

export { convertUnit, isConversionExpression };

/** 安全计算：仅允许数字与 + - * / ( ) 及空白，解析并求值 */
function safeEval(expr: string): number | null {
  const s = expr.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/");
  if (!/^[\d.+\-*/()\s]+$/.test(s)) return null;
  let i = 0;
  const len = s.length;
  function skipSpace() {
    while (i < len && /\s/.test(s[i])) i++;
  }
  function parseNum(): number | null {
    skipSpace();
    if (i >= len) return null;
    let start = i;
    if (s[i] === "-" && (i === 0 || s[i - 1] === "(")) {
      i++;
      const n = parseNum();
      return n === null ? null : -n;
    }
    if (s[i] === "+" && (i === 0 || s[i - 1] === "(")) {
      i++;
      return parseNum();
    }
    if (s[i] === "(") {
      i++;
      const v = parseExpr();
      skipSpace();
      if (i < len && s[i] === ")") i++;
      return v;
    }
    if (!/\d/.test(s[i])) return null;
    while (i < len && /[\d.]/.test(s[i])) i++;
    const sub = s.slice(start, i);
    const n = parseFloat(sub);
    return Number.isFinite(n) ? n : null;
  }
  function parseTerm(): number | null {
    let left = parseNum();
    if (left === null) return null;
    skipSpace();
    while (i < len && (s[i] === "*" || s[i] === "/")) {
      const op = s[i];
      i++;
      const right = parseNum();
      if (right === null) return null;
      left = op === "*" ? left * right : right === 0 ? NaN : left / right;
      skipSpace();
    }
    return left;
  }
  function parseExpr(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    skipSpace();
    while (i < len && (s[i] === "+" || s[i] === "-")) {
      const op = s[i];
      i++;
      const right = parseTerm();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
      skipSpace();
    }
    return left;
  }
  const result = parseExpr();
  if (result === null || i < len) return null;
  return Number.isFinite(result) ? result : null;
}

/** 判断输入是否为可计算表达式（用于无 trigger 时直接当计算器） */
export function isCalculableExpression(s: string): boolean {
  const t = s.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").trim();
  if (!t || !/^[\d.+\-*/()]+$/.test(t)) return false;
  return safeEval(t) !== null;
}

export const calculate: Command = {
  id: "calculate",
  key: "calc",
  title: "Calculator",
  desc: "Evaluate math expression",
  async getResultFromFilter(filter: string): Promise<ResultItem[]> {
    const trimmed = filter.trim();
    if (!trimmed) return [{ id: "calc-none", title: "Enter expression", desc: "e.g. 1+2*3 · 5ft in cm · 100 usd to cny (实时汇率)" }];
    // 单位/货币换算优先（5ft in cm / 100 usd to cny / 32 c in f），货币走实时汇率
    const converted = await convertUnit(trimmed);
    if (converted) {
      return [
        {
          id: "calc-convert",
          title: converted.value,
          desc: converted.desc,
          copyValue: converted.value,
        },
      ];
    }
    const result = safeEval(trimmed);
    if (result === null)
      return [{ id: "calc-err", title: "Invalid expression", desc: "Only numbers and + - * / ( ), or units: 5ft in cm" }];
    const str = Number.isInteger(result) ? String(result) : result.toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
    return [
      {
        id: "calc-result",
        title: str,
        desc: "Copy result",
        copyValue: str,
      },
    ];
  },
};
