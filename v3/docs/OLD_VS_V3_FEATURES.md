# 旧版有、v3 暂无的架构/功能（非插件能力）

对比 `extension/` 与 `v3/`，以下为**架构或产品级**差异（不含「某个具体插件」本身，如 calculate、pocket）。

---

## 一、已明确首版不做的（迁移规划内）

| 项目 | 旧版 | v3 | 说明 |
|------|------|-----|------|
| **Newtab 新标签页** | `chrome_url_overrides.newtab`，整页命令框 + 壁纸/组件 | 无 | 规划首版不做，易影响过审 |
| **自定义插件（用户写代码）** | custom 插件 + `new Function` 执行 | 无 | 违反 MV3 政策，已移除 |

---

## 二、架构/功能上的差异（v3 可后续考虑）

### 1. 双模式与打开方式

- **旧版**：有 `MODE.NEWTAB` / `MODE.POPUP`，且区分「弹窗内」与「content 页内」；在 content 里打开链接时可根据 metaKey 选择「当前 tab 更新」或「新 tab」。
- **v3**：只有 popup（点击图标）+ content 内 iframe 命令框，未区分「当前 tab 更新」vs「新 tab」的快捷键行为。

### 2. 可配置快捷键（命令前缀）

- **旧版**：`general.shortcuts`，如 `pageboxShortcut_0` ~ `pageboxShortcut_9` 可绑定到不同命令前缀（如 `his `、`tab `、`bm `、`wf ` 等），manifest 里多条 `commands` 对应这些快捷键。
- **v3**：仅固定 `_execute_action`（Command+K）和 `open-in-content-page`（Command+J），**不能**在设置里把某快捷键绑到「直接进入 his / tab / bm」等。

### 3. Workflows 工作流

- **旧版**：独立 Workflows 体系——编辑、保存、执行工作流；支持**批量执行**（格式如 `1-n | all | n`），用于在工作流里一次执行多条命令。
- **v3**：已支持——Options「工作流」Tab 增删改工作流；命令框 `wf` 列出并执行；每行格式 `输入 | n` / `1-n` / `all`，顺序执行。暂无 wfe 行内编辑、Shift 批量。

### 4. Websites 按站配置

- **旧版**：**Websites** 概念——按 host 配置当前站的 navs、outline、paths、anchors、meta 等；可「为当前站安装/卸载配置」、自动创建站点配置（autoCreateWebsite）；有 wsm 等插件与 Websites 配置页。
- **v3**：无「按站点」的配置，nav/outline/meta 是通用逻辑，不按 host 区分。

### 5. Options 多 Tab 与配置深度

- **旧版**：多 Tab——General / **Plugins** / **Workflows** / **Websites** / Wallpapers / NewtabComponents / **Appearance** / **Advanced** / Help / Update；General 里除 speedFirst、cacheLastCmd 外还有 defaultPlugin、customCmd、autoScrollToMiddle、shortcuts、maxOperandsNum、autoCreateWebsite 等。
- **v3**：**General** + **Plugins** + **Workflows** + 关于；无 Websites/Appearance/Advanced/Help/Update 等 Tab。

### 6. 插件级启用/禁用与选项

- **旧版**：每个插件可有 `canDisabled`、`optionsSchema`、`defaultOptions`；config 里存 `plugins[pluginName].disabled` 和 `options`；Options 的 Plugins Tab 可开关插件、改插件选项。
- **v3**：命令是写死的列表，**不能**在设置里禁用某条命令或改某命令的选项。

### 7. Shift 批量执行

- **旧版**：列表项可带 `shiftKey`；**Shift + Enter** 走 `batchExecutionIfNeeded`，支持一次对多项执行（如多 tab 打开、批量禁用等），并与 workflow 的 `1-n | all | n` 格式配合。
- **v3**：只有单条 Enter 执行，无 Shift 多选/批量执行。

### 8. Appearance 外观

- **旧版**：Appearance 相关配置（主题、字体等，与 newtab/组件展示相关）。
- **v3**：无独立「外观」配置页。

### 9. 多语言 _locales

- **旧版**：`_locales/en`、`_locales/zh_CN`，文案通过 `chrome.i18n` 获取。
- **v3**：文案写死在代码里，无 i18n。

### 10. Help / Update

- **旧版**：Options 内有 Help、Update（Changelog/更新说明）等 Tab。
- **v3**：无。

---

## 三、小结（可做优先级参考）

- **与「打开方式/效率」强相关**：可配置快捷键（2）、Shift 批量执行（7）、双模式下的「当前 tab 更新」（1）。
- **与「可扩展配置」相关**：Workflows（3）、Websites（4）、插件级开关与选项（6）、Options 多 Tab（5）。
- **与「展示/体验」相关**：Newtab（已明确不做）、Appearance（8）、多语言（9）、Help/Update（10）。

若 v3 要逐步对齐旧版体验，可优先考虑：**可配置快捷键**、**Shift 批量执行**、**Options 多 Tab（至少 General 增强 + Help）**，再视需要做 Workflows/Websites/插件开关等。
