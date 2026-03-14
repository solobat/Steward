/**
 * 工作流：类 bash 命令序列。
 * 格式：command [filter] [-- 选择 [shift] [alt]]，选择为 1、1-5、all 或 *；shift=批量打开，alt=当前标签打开（范围时仅最后一条用当前标签）。多步用 ; 分隔，行末 # 注释。
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

export interface ParsedWorkflowLine {
  input: string;
  numbers?: WorkflowLineNumbers;
  withShift?: boolean;
  withAlt?: boolean;
}
