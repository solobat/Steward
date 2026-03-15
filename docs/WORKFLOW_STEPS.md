# 工作流步骤类型

工作流由多行组成，每行格式：`command [filter] [-- 选择 [shift] [alt]]`，或预定义步骤（等待、聚焦窗口）。同行多步用 `;` 分隔，行末 `#` 注释。

---

## 一、命令步骤（带选择）

- **格式**：`命令关键词 [过滤词] [-- 选择 [shift] [alt]]`
- **选择**：`1`（第 1 条）、`1-5`（范围）、`all` 或 `*`（全部）
- **修饰**：`shift` = 批量打开（从首项到当前项所有带 url 的在新标签打开），`alt` = 当前标签打开（范围时仅最后一条用当前标签）
- **示例**：`his -- 1`、`bm star -- 2`、`tab -- 1-3`、`his -- 1 ; bm -- 1`

---

## 二、预定义步骤（无选择，直接推进）

### 1. 等待 `wait`

- **格式**：`wait 时长`
- **时长**：
  - 毫秒：`wait 500`、`wait 1000`
  - 秒（小数或带 s）：`wait 0.5`、`wait 1s`
- **上限**：60 秒（60000 ms）
- **示例**：`wait 500` 表示暂停 500ms 后执行下一步。

### 2. 聚焦窗口 `window` / `focus`

- **格式**：`window N` 或 `focus N`
- **N**：1-based 窗口序号（按 Chrome 返回的窗口顺序）
- **行为**：将第 N 个窗口置为焦点，然后继续下一步。
- **示例**：`window 1`、`focus 2`

---

## 三、组合示例

```
his -- 1
wait 300
bm -- 1
window 2
tab -- 1
```

表示：选第 1 条历史 → 等 300ms → 选第 1 条书签 → 聚焦第 2 个窗口 → 选第 1 个标签。

---

## 四、实现位置

- 解析：`src/lib/workflow.ts`（`parseWorkflow`、`isWaitStep`、`parseWaitMs`、`isFocusWindowStep`、`parseFocusWindowIndex`）
- 执行：`src/popup/CmdBox.tsx`（`advanceWorkflow`、`focusWindowByIndex`；wait 用 `setTimeout` 再调 `advanceWorkflow`）
