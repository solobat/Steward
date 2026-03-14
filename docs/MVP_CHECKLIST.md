# Steward v3 MVP 检查清单

## 结论：**已达到 MVP**

可作为「最小可行产品」使用：核心流程闭环、易过审、无已知阻断问题。

---

## 一、规划要求对照（迁移文档首版范围）

| 要求 | 状态 | 说明 |
|------|------|------|
| 代码在 `v3/` 独立开发 | ✅ | 全部在 v3/，不修改 v2/ |
| MV3 | ✅ | manifest_version: 3，Service Worker |
| 无 newtab | ✅ | 无 chrome_url_overrides |
| 无 eval / 无自定义插件执行 | ✅ | 无 unsafe-eval，无 new Function |
| action + content script + options + popup | ✅ | 齐全 |
| 仅内置插件 | ✅ | 当前页信息、页面链接、大纲、历史、书签、设置、关闭 |
| storage + commands | ✅ | sync/local，Command+K / Command+J |
| React + Tailwind + DaisyUI | ✅ | 无 Vue/ElementUI |

---

## 二、核心能力闭环

| 能力 | 状态 |
|------|------|
| 快捷键打开命令框（Command+J） | ✅ |
| 命令框内输入过滤、↑↓ 选择、Enter 执行 | ✅ |
| 当前页信息（复制） | ✅ |
| 页面链接（当前页内跳转） | ✅ |
| 页面大纲（滚动到标题） | ✅ |
| 历史记录（新标签打开） | ✅ |
| 书签（新标签打开） | ✅ |
| 打开设置 / 关闭 | ✅ |
| 设置页：速度优先、记忆上次命令 | ✅ |
| 设置保存到 storage | ✅ |
| 弹窗（Command+K） | ✅ |

---

## 三、技术实现要点

- **Background**：getConfig / getData / saveConfig，getHistory / getBookmarks（委托 `commands/his/background`、`commands/bm/background`），saveLastQuery / getLastQuery，commands.onCommand → openBox。
- **Content**：按 speedFirst 决定是否提前注入；iframe 命令框；postMessage 委托 `commands/meta/content`、`commands/nav/content`、`commands/outline/content`（GET_META / QUERY_NAVS / GEN_OUTLINE / CLICK_NAV / SCROLL_TO_OUTLINE）。
- **CmdBox**：从 `commands` 注册表取 TRIGGERS；每命令 load/execute 在各自目录实现；lastQuery 预填与防抖保存；Esc / visibilitychange 保存；↑↓ 选中项 scrollIntoView。
- **Options**：General + 关于；config 读写。
- **命令结构**：`src/commands/` 下每命令一目录，含 `index.ts`（定义+popup 逻辑），跨端时含 `background.ts` 或 `content.ts`。

---

## 四、MVP 尚不包含（预期内）

- newtab 定制页
- 自定义插件（用户写代码）
- 更多内置插件（如搜索、workflow、tab 管理）
- 多语言 / _locales
- 商店上架用素材（截图、详细描述、隐私政策链接）

---

## 五、建议发布前自测

1. `cd v3 && npm install && npm run build`，在 Chrome 加载 `dist`。
2. 复制 `v2/extension/img` 图标到 `v3/public/img`，否则图标缺失。
3. 在任意网页：Command+J 打开框 → 依次试「当前页信息」「页面链接」「页面大纲」「历史」「书签」→ 设置页改「速度优先」「记忆上次命令」并保存 → 关闭再打开看预填。

若以上通过，可视为 **MVP 完成**，可打包提交审核或继续迭代功能。
