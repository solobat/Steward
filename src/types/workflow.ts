/**
 * 工作流：类 bash 命令序列。
 * 格式：command [filter] [-- 选择 [shift] [alt]]，选择为 1、1-5、all 或 *；shift=批量打开，alt=当前标签打开（范围时仅最后一条用当前标签）。多步用 ; 分隔，行末 # 注释。
 * 增强：set key=value 变量、{{key}}/{{clipboard}}/{{date}}/{{time}}/{{i}} 替换、repeat N ... end 循环、if 条件 ... end、copy/note+ 控制步骤。
 */
export interface Workflow {
  id: string;
  title: string;
  desc?: string;
  content: string;
  created?: number;
  updated?: number;
}

export type WorkflowLineNumbers = number | [string, string] | -1; // -1 = all

export interface WorkflowLineCondition {
  left: string;
  op: string;
  right: string;
}

export interface ParsedWorkflowLine {
  input: string;
  numbers?: WorkflowLineNumbers;
  withShift?: boolean;
  withAlt?: boolean;
  /** repeat 展开时的迭代序号（1-based），供 {{i}} */
  iteration?: number;
  /** 控制行：set / if / end / copy / note（不执行命令，直接推进） */
  control?: "set" | "if" | "end" | "copy" | "note";
  /** if 条件为假时跳转到的行号（指向 end 行），-1 表示不跳转 */
  ifSkipTo?: number;
  /** if 条件（已解析） */
  condition?: WorkflowLineCondition;
}
