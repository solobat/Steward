# Steward 扩展：Manifest V3 升级与技术栈重构规划（修订版）

本规划采用**当前最佳实践**，**激进迁移**：MV3 + React + Tailwind + DaisyUI，**暂缓易导致审核不通过的功能**，优先实现易过审的核心能力，**不考虑老用户兼容**。

**新版本在项目根目录下的 `v3/` 目录中独立开发**，不修改原有 `extension/` 代码。**首版不含 newtab 功能**（无 `chrome_url_overrides`、无新标签页定制页）。

---

## 一、原则与约束

| 原则 | 说明 |
|------|------|
| **技术选型** | 采用当前最佳实践：MV3、Vite 构建、React 18、TypeScript、Tailwind、DaisyUI |
| **UI 栈** | 全面弃用 Vue/ElementUI，改用 **React + Tailwind + DaisyUI**（轻量、易过审） |
| **审核优先** | 凡易导致审核不通过的功能**先暂停**，首版只做易过审功能 |
| **激进** | 不兼容老数据/老能力，可改存储结构、砍掉自定义插件等 |

---

## 二、易导致审核不通过 → 先暂停

根据 Chrome Web Store 常见拒绝原因与 MV3 政策，以下功能**首版不做**：

| 功能 | 原因 | 处理方式 |
|------|------|----------|
| **自定义插件（用户写代码并执行）** | `new Function(source)` 等同动态执行远程/用户代码，违反 MV3「禁止 remotely hosted code / eval」 | **首版移除**：不提供“自定义插件”入口；内置插件保留 |
| **`unsafe-eval` / 任意 eval** | MV3 CSP 禁止，且易触发人工复审 | **彻底移除**：不申明、不使用 |
| **动态加载并执行 Vue 组件（httpVueLoader）** | 从 URL 拉组件再执行，易被视作远程代码 | **随 Vue 一起移除**：改为 React 静态组件 |
| **过宽 host 权限** | `<all_urls>` 易触发严格审查 | **首版可保留**（内容脚本需要），但权限列表尽量精简，不申明用不到的权限 |
| **第三方脚本（如 Google Analytics）** | 部分审核会查外部脚本与隐私 | **首版可移除** CSP 中的 `https://ssl.google-analytics.com`，后续如需再按商店要求加隐私说明 |

**首版保留且易过审的核心**：MV3 manifest、Service Worker、action、content script（命令框）、**仅内置插件**、options、popup、storage、commands，全部为扩展包内自包含逻辑，无 eval、无用户代码执行。**不含 newtab / 新标签页定制**。

---

## 三、技术选型（最佳实践）

### 3.1 构建与目录

- **新版本代码位置**：在项目根目录下新建 **`v3/`** 目录，所有 MV3 相关开发与构建均在 `v3/` 内完成，不修改 `extension/`。
- **Vite 5.x + @samrum/vite-plugin-web-extension**：当前扩展圈常用方案，支持 MV3、多入口、单文件 service worker；配置见 `v3/vite.config.ts`。
- **备选**：若后续需在旧仓库内构建，可保留 Webpack 并单独为 background 打出**单文件** `background.js`（MV3 要求）。

### 3.2 前端

- **React 18** + **TypeScript**：组件、options、popup 页面全部用 React 重写（v3 首版不含 newtab，无 steward 新标签页）。
- **Tailwind CSS**：工具类优先，与 DaisyUI 搭配。
- **DaisyUI**：轻量 UI 组件（按钮、卡片、表单、模态框等），主题多、体积可控，适合扩展。
- **不再使用**：Vue、VueRouter、ElementUI、VueGridLayout、http-vue-loader、jQuery（background 用原生或轻量工具函数）。

### 3.3 状态与通信

- **chrome.storage**：配置、todo、workflows 等仍用 storage；Service Worker 不常驻内存，按需从 storage 读。
- **消息**：`chrome.runtime.sendMessage` / `onMessage` 统一 **Promise/async**，符合 MV3 推荐。

### 3.4 代码执行

- **仅内置插件**：所有插件为扩展包内已打包的模块，通过 import 注册，**不**解析、不执行用户提供的字符串代码。
- **计算插件**：继续使用 `math-expression-evaluator` 的 **库内 `mathexp.eval()`**（数学表达式），这是库 API 名，非 JS `eval`，符合政策。

---

## 四、分步实施计划

### 阶段 1：MV3 基础与构建（在 v3/ 内完成）

**目标**：在 **`v3/`** 目录内完成 MV3 manifest、构建与 Service Worker，产出可加载的扩展包。不修改 `extension/`，**不含 newtab**。

1. **1.1 Manifest**
   - `manifest_version: 3`。
   - `background`: `"service_worker": "background.js"`（单文件）。
   - `browser_action` → `action`。
   - 移除 `optional_permissions` 中的 `"background"`。
   - CSP：使用 MV3 的 `extension_pages`，**不含** `'unsafe-eval'`，不引用外部脚本（首版可去掉 Google Analytics）。
   - `web_accessible_resources` 改为 `[{ "resources": [...], "matches": ["<all_urls>"] }]`。
   - `host_permissions`：将 `<all_urls>` 放入 `host_permissions`（与 `permissions` 分离）。

2. **1.2 构建（v3/）**
   - 在 **`v3/`** 下使用 Vite + @samrum/vite-plugin-web-extension，`manifest.json` 中 `background.service_worker` 指向 `src/background.ts`，由插件产出单文件 service worker。
   - 构建产物在 `v3/dist`，Chrome 加载已解压扩展时选择该目录。图标等静态资源放在 `v3/public/img/`（可从本目录 `extension/img` 复制）。

3. **1.3 Background 逻辑（MV3 兼容）**
   - 去掉 jQuery，用 `Object.assign` 或简单 deep merge。
   - `onMessage` 改为 **async**，用 `return` 返回结果（或 `return true` + 异步 `sendResponse`）。
   - 不依赖长期内存状态：每次请求从 `chrome.storage` 读 config/todos/blockedUrls，或 SW 启动时读一次并在 `storage.onChanged` 中更新缓存（二选一即可）。

4. **1.4 消息调用方**
   - 所有 `chrome.runtime.sendMessage(..., callback)` 改为 `await chrome.runtime.sendMessage(...)` 或 `.then(...)`，统一 Promise 化。

5. **1.5 暂停与移除**
   - **关闭「自定义插件」功能**：options 里不展示“自定义插件”编辑/运行；`getCustomPlugins()` 返回空数组或从主流程中移除调用，确保**不执行** `pluginFactory` 里 `new Function` 的路径。
   - 移除 CSP 的 `unsafe-eval` 后，若仍有代码路径走到 `new Function`，直接短路返回，避免运行时报错。

**交付**：在 **`v3/dist`** 得到可加载的 MV3 扩展（background 为 SW、无 eval、无自定义插件、无 newtab）。popup/options/content 在 v3 内为 React 占位，后续在 v3 内继续迭代。

---

### 阶段 2：在 v3/ 内完善 React + Tailwind + DaisyUI 页面

**目标**：在 **`v3/`** 内完成 options、popup 的 React 页面与 content 逻辑迁移，统一 Tailwind + DaisyUI。**不包含 newtab / 新标签页**。

1. **2.1 工程与依赖**
   - 已在 **`v3/`** 使用 **Vite + React + TypeScript + Tailwind + DaisyUI**（见 `v3/package.json`）。无需 Vue/ElementUI/httpVueLoader。

2. **2.2 页面与路由**
   - **Options**：在 `v3/src/options/` 下用 React 实现多 Tab（General、Plugins、Workflows、Websites、Wallpapers、Appearance、Advanced、Help、Update 等），**不含 Newtab 相关 Tab**；样式用 Tailwind + DaisyUI。
   - **Popup**：在 `v3/src/popup/` 下保持单一 React 根组件，轻量 UI。
   - **Newtab**：首版不做，不实现 steward 新标签页与 `chrome_url_overrides`。

3. **2.3 组件与逻辑迁移**
   - 从 `extension/` 仅迁移易过审、无 eval 的逻辑到 `v3/src/`；原 Vue 组件改为 React 组件并**静态**引入。
   - 与 background/content 的交互统一为 `chrome.runtime.sendMessage` + Promise。

4. **2.4 构建产物**
   - popup、options、content、background 均由 Vite 插件根据 `v3/manifest.json` 生成；manifest 中**不**包含 `chrome_url_overrides`。

**交付**：v3 扩展内 UI 为 React + Tailwind + DaisyUI，功能为首版范围（无 newtab、无自定义插件）。

---

### 阶段 3：权限收紧与审核友好

**目标**：权限与声明最小化，隐私与描述清晰，便于过审。

1. **3.1 权限**
   - 仅声明实际使用的权限；不用到的从 manifest 删除。
   - `host_permissions` 若确实需要 content script 全站可用，保留 `<all_urls>`；否则收窄为具体域名。

2. **3.2 隐私与描述**
   - 若不再使用 Google Analytics，不声明、不加载；若后续要加统计，需隐私政策并符合商店要求。
   - 商店描述：单一核心用途（如“快捷命令与搜索”），不堆砌无关关键词。

3. **3.3 单 manifest（v3 首版）**
   - **`v3/`** 内仅维护一份 **manifest.json**，**不含** `chrome_url_overrides`（无 newtab）。若后续需要 Plus 版再单独增加 manifest 或构建变体。

**交付**：满足 Chrome Web Store MV3 与单用途、权限最小化、无远程代码/无 eval 的审核要求。

---

### 阶段 4（可选）：后续可考虑的能力

- **自定义“配置型”命令**：不执行用户代码，仅通过 UI 配置关键词、URL 模板、内置动作等（无需 `new Function`），便于过审。
- **沙箱页执行用户代码**：仅当产品强依赖“用户写代码”时再考虑；实现复杂且仍有审核与安全风险，建议慎用。
- **Google Analytics**：若需要，在补全隐私政策与披露后再加。

---

## 五、执行顺序与风险

| 阶段 | 内容 | 风险 |
|------|------|------|
| 1 | MV3 manifest、单文件 background、消息 Promise 化、**关闭自定义插件与 unsafe-eval** | 中：需验证所有与 background 的通信；自定义插件入口需全部屏蔽 |
| 2 | 移除 Vue，Options/Popup/Steward 用 React + Tailwind + DaisyUI 重写 | 中：工作量大，可按页面分批替换 |
| 3 | 权限与审核友好、双 manifest 与商店准备 | 低 |

建议**严格按 1 → 2 → 3** 执行：先保证 MV3 + 无 eval + 无用户代码执行（易过审），再换 UI 栈，最后收尾审核与发布。

---

## 六、首版功能范围小结

- **代码位置**：新版本在根目录 **`v3/`** 下独立开发，不修改 `extension/`。
- **包含**：MV3、Service Worker、action、content script（命令框）、内置插件（无用户代码执行）、options、popup、storage、commands、Tailwind + DaisyUI。
- **不包含（首版）**：**newtab / 新标签页**（无 `chrome_url_overrides`）；自定义插件（用户写代码并执行）；`unsafe-eval`、httpVueLoader、Vue/ElementUI；对老数据/老自定义插件的兼容。

按此规划实施后，技术栈符合当前最佳实践，首版聚焦易过审功能，便于后续迭代。
