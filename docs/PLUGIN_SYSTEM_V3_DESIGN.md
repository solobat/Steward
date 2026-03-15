# v3 开放插件/扩展能力设计方案

## 一、旧版与 Alfred 的「开放」方式

### 1.1 Steward 旧版（v2）自定义插件

- **入口**：Options → Advanced → 自定义插件，用户编写 JS 源码并保存。
- **执行**：源码通过 `new Function('module', source)(pluginModule)` 在扩展上下文中执行，得到符合 `Plugin` 接口的对象（`name`、`commands`、`onInput`、`onEnter` 等）。
- **能力**：用户可定义新触发词、根据 query 返回结果列表、在 onEnter 里执行任意逻辑（复制、打开 URL、发消息等），并能访问 `Steward` 全局（即扩展 API）。
- **模板**：见 `v2/extension/constant/code.ts`，用户导出 `module.exports = function(steward) { return { commands, onInput, onEnter, ... }; }`。

因此旧版是**真正的「用户写代码、扩展内执行」**，灵活度最高，但依赖 `new Function`。

### 1.2 Alfred

- **工作流**：由 Trigger、Input、Action 等块组成；用户不写「插件源码」，而是搭积木。
- **脚本**：通过 **Run Script** / **Script Filter** 调用**系统解释器**（Bash、Python 等），脚本在 **macOS 进程**中运行，不在 Alfred 进程里执行任意 JS。
- **开放点**：可组合内置块 + 系统脚本；脚本通过 stdout/环境变量与 Alfred 交换数据，Alfred 不 `eval` 用户代码。

因此 Alfred 的开放是**「组合 + 外部脚本」**，扩展内不执行用户提供的代码。

---

## 二、MV3 对「用户代码」的约束

- Chrome 扩展 **Content Security Policy** 禁止 `eval()`、`new Function()` 以及**远程加载并执行的脚本**（remotely hosted code）。
- 自定义插件若继续用 `new Function(source)` 在扩展内执行用户源码，**无法通过 MV3 与商店审核**。
- 因此：**在扩展进程内执行用户提供的任意 JS 源码，在 v3 中不可行**。

---

## 三、v3 可选的开放方向

在「不执行用户 JS」的前提下，仍可做多种程度的「开放」，从易过审到需额外安装，依次如下。

### 方案 A：配置型「插件」（推荐，易过审）

**思路**：不执行任何用户代码；用户通过**配置/声明**定义新触发词与行为，由扩展**解释执行**。

- **数据形态**：每条「自定义命令」对应一条配置，例如：
  - `id`、`key`（触发词）、`title`、可选的 `desc`、`icon`（URL 或内置名）；
  - **结果来源**：枚举一种或组合（见下）；
  - **执行动作**：枚举一种（打开 URL、复制文本、运行内置命令、运行工作流等）。

- **结果来源** 可支持：
  - **静态列表**：配置里写死若干项 `{ title, desc?, url? }`，输入时直接展示；
  - **URL 模板**：用 `{query}` 替换后请求一个 **JSON API**，扩展只做 `fetch` + `JSON.parse`，**不**把响应当脚本执行；返回的 JSON 约定为 `[{ title, desc?, url? }]`；
  - **内置能力**：如「当前标签页」「剪贴板」「固定若干 chrome:// 页」等，由扩展内置实现，配置里只选类型与参数。

- **执行动作** 示例：
  - 打开 URL（支持 `{query}` 等占位符）；
  - 复制到剪贴板；
  - 触发已有工作流或内置命令（如「打开设置」）。

- **存储**：与现有 config 一致，存 `chrome.storage.sync`（或单独 key），支持导入/导出 JSON，便于分享「插件包」。

- **优点**：无 eval、无远程代码执行、符合 MV3；实现成本相对可控；用户和社区可分享 JSON「插件」。
- **缺点**：无法实现任意逻辑，只能做「数据源 + 固定动作」的组合。

---

### 方案 B：Native Messaging 宿主（真脚本，需装本地程序）

**思路**：扩展**不执行**用户代码；用户脚本由**本地安装的 Native Messaging Host** 执行（类似 Alfred 的 Run Script 在系统里跑）。

- **流程**：
  1. 用户在本机安装一个「Steward 脚本宿主」程序（如通过 npm 全局包或小型安装器）；
  2. 该程序向 Chrome 注册为 Native Messaging Host，与扩展通过 stdin/stdout 通信；
  3. 扩展在需要时发送消息，例如：`{ action: "run", key: "myScript", query: "..." }`；
  4. 宿主根据 key 找到用户配置的脚本（如 `~/.steward/scripts/myScript.js`），用 Node/Python 等执行，将结果打印到 stdout；
  5. 扩展解析 stdout（如 JSON 行），得到结果列表并展示；用户选择某项后，可再发消息让宿主执行「打开 URL」等。

- **优点**：用户可写任意脚本（Node/Python/Bash），能力与 Alfred 的 Run Script 接近；扩展侧完全不 eval、不执行用户代码，符合 MV3。
- **缺点**：需单独安装与维护宿主、跨平台（Win/Mac/Linux）与升级体验较重；普通用户门槛高，更适合进阶用户。

---

### 方案 C：沙箱页 / Worker 中执行用户代码（不推荐）

**思路**：在扩展的 sandbox 页或 Worker 中加载用户提供的脚本，通过 `postMessage` 与扩展主逻辑通信。

- **问题**：
  - 即使用 sandbox iframe 或 Worker，若脚本来源是**用户输入的字符串**并转为 Blob URL 再加载，仍可能被认定为「执行用户/远程代码」，存在**商店审核与政策风险**；
  - 实现复杂（通信协议、超时、错误隔离），且需严格限制脚本可访问的 API（无法直接给 chrome.*），能力与旧版相比大幅缩水。

**结论**：仅在产品**强依赖**「扩展内跑用户代码」且愿意承担审核与安全风险时再考虑；当前更建议优先做 A 或 B。

---

## 四、推荐实施顺序

1. **先做方案 A（配置型插件）**
   - 在现有「命令 + 工作流」之上，增加「自定义命令」配置：触发词、结果来源（静态列表 / URL 模板 / 内置）、执行动作（打开 URL / 复制 / 调工作流等）。
   - 可选：支持从 URL 拉取**纯数据** JSON（约定 schema），不执行任何来自该 URL 的脚本。
   - 文档中说明：v3 不支持旧版「写 JS 源码在扩展内执行」的自定义插件，但可通过配置与 JSON 数据源实现多数常用场景。

2. **再视需求做方案 B（Native Messaging）**
   - 若需要「真正写脚本、在本地执行」的用户，再提供宿主规范与示例（如一个最小 Node 宿主），文档说明安装与配置方式；扩展侧只发收消息、解析结果，不执行任何用户代码。

3. **不实施方案 C**，除非有明确需求且接受审核与安全成本。

---

## 五、方案 A 与现有 v3 的衔接

- **命令注册**：自定义命令与内置命令统一进「命令列表」；自定义命令的 `load` / `execute` 由扩展根据配置分支到：
  - 静态列表 → 直接 `setItems`；
  - URL 模板 → `fetch` + 解析 JSON → `setItems`；
  - 内置数据源 → 调用现有 his/bm/chrome 页等；
- **执行**：根据配置的「动作类型」调用已有能力（打开 URL、复制、运行工作流等），不新增 `eval`/`new Function`。
- **存储**：例如 `config.customCommands: CustomCommand[]`，与 `plugins`、`workflows` 并列；Options 增加「自定义命令」Tab，支持增删改、导入导出 JSON。

这样 v3 在**不执行用户代码**的前提下，仍能提供「用户可自行定义与分享的扩展能力」，与 Alfred/旧版在「开放」思路上对齐，但实现方式符合 MV3。
