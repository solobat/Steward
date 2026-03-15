# Chrome 商店上架：隐私与必填项

上传时若提示「必须提供权限理由」「未选择语言」「无法访问网站链接」，按下面逐项处理。

---

## 一、权限理由（隐私权规范 / Privacy practices）

在开发者后台 **隐私权规范** 或 **权限说明** 处，为以下权限填写理由（可复制下面文案）。

### activeTab

```
用户通过点击扩展图标或使用快捷键（如 Ctrl+J）主动打开命令框时，扩展需要访问当前活动标签页，用于：获取当前页面标题与元信息、生成页面内链接列表与大纲、在“当前页打开”时更新该标签页 URL。仅在用户显式触发时请求，不后台读取。
```

**英文（若需）：**
```
When the user opens the command box by clicking the extension icon or shortcut (e.g. Ctrl+J), the extension needs access to the active tab to: get the current page title and metadata, build in-page links and outline, and update the tab URL when "open in current tab" is chosen. Access is requested only on explicit user action, not in the background.
```

### tabs

```
用于实现扩展核心功能：在命令框中展示并切换/关闭/静音/固定标签页；将历史、书签、页面链接等结果在“新标签页打开”或“当前标签页打开”；以及响应快捷键时向当前标签页注入命令框。所有操作均在用户主动使用命令框时进行，不在后台收集或上传标签数据。
```

**英文（若需）：**
```
Used for core features: list and switch/close/mute/pin tabs from the command box; open history, bookmarks, and page links in a new tab or the current tab; and inject the command box into the current tab when the user triggers the shortcut. All use happens when the user actively uses the command box; we do not collect or upload tab data in the background.
```

### alarms

```
用于工作流（Workflow）中的「等待」步骤：用户在工作流里设置“等待 N 秒后执行下一步”（如先打开 A 页、等待 5 秒、再打开 B 页）时，扩展需要在到点后执行下一步。弹窗关闭后无法用普通定时器，因此使用 Chrome 的 alarms API 在后台到点触发，仅按用户配置的延迟执行后续步骤，不收集、不上传任何数据。
```

**英文（若需）：**
```
Used for the “wait” step in Workflows: when the user sets a delay in a workflow (e.g. open page A, wait 5 seconds, then open page B), the extension needs to run the next step at the scheduled time. The popup may be closed by then, so we use the Chrome alarms API to trigger in the background at the right time. Only used to run the user’s chosen next step after their configured delay; no data is collected or uploaded.
```

---

## 二、未选择语言

在商店后台 **商品信息** / **Store listing** 中：

- 至少选择一种 **主要语言**（如 **中文（简体）** 或 **English**）。
- 填写该语言下的 **简短说明**、**详细说明** 等，保存后再提交。

---

## 三、无法访问网站链接

商店要求填的 **隐私政策网址**、**支持/主页链接** 等必须为 **公网可访问的 HTTPS 地址**。

1. **先部署文档站**  
   将 `docs-website` 部署到可公网访问的地址，例如：
   - Vercel：在项目里配置 `vercel.json` 指向 `docs:build` 与 `docs-website/.vitepress/dist`，部署后得到 `https://<your-project>.vercel.app`。
   - 其他：用 `pnpm run docs:build` 构建后，把 `docs-website/.vitepress/dist` 部署到任意静态托管。

2. **再填进商店**  
   - **隐私政策**：`https://<你的域名>/privacy`（对应本站的 `/privacy` 页面）。  
   - **支持/主页**：可填同一域名首页或 GitHub 仓库地址，如 `https://github.com/solobat/Steward`。

3. **自检**  
   在浏览器无痕窗口打开上述链接，确认能正常打开且无证书错误，再保存商店信息并重新提交。

---

## 四、商店说明文案（简短说明 / 详细说明）

在 **商品信息** 里选择语言后，需填写「简短说明」和「详细说明」。可直接复制下面文案。

### 中文（简体）

**简短说明**（约 132 字以内）：

```
Chrome 命令启动器：快捷键打开命令框，用触发词搜索书签、历史、标签、工作流与页面链接，支持当前页打开与外观自定义。Manifest V3，数据存本地。
```

**详细说明**：

```
Steward 是一款基于 Manifest V3 的 Chrome 命令启动器，通过快捷键在弹窗或当前页面内打开命令框，输入触发词即可快速访问常用功能。

【主要功能】
• 快捷键：Ctrl+K（Mac：Command+K）打开弹窗命令框，Ctrl+J 在当前页面内打开
• 书签 / 历史 / 标签：bm、his、tab 等触发词搜索并打开
• 页面内：获取当前页信息、页面链接、大纲（nav、outline、meta）
• 工作流与搜索：自定义工作流、搜索引擎与计算
• 外观：主题、字号、强调色、列表密度等可调，支持导出/导入配置

【隐私与数据】
配置与设置保存在 Chrome 同步存储或本地，书签/历史/标签仅在本地读取与展示，不上传。详见扩展文档站隐私政策。
```

---

### English

**Short description**（132 characters or less）：

```
Command launcher for Chrome: shortcut opens command box, search bookmarks, history, tabs & links by keyword. MV3, data stays local.
```

**Detailed description**：

```
Steward is a Chrome command launcher built on Manifest V3. Use a keyboard shortcut to open the command box in a popup or on the current page, then type a keyword to search bookmarks, history, tabs, and more.

【Features】
• Shortcuts: Ctrl+K (Command+K on Mac) for popup, Ctrl+J for in-page command box
• Bookmarks / History / Tabs: use triggers like bm, his, tab to search and open
• Current page: get page info, in-page links, outline (nav, outline, meta)
• Workflows & search: custom workflows, search engines, and calculator
• Appearance: theme, font size, accent color, list density; export/import settings

【Privacy】
Settings are stored in Chrome sync or locally. Bookmarks, history, and tabs are read and shown only on your device; nothing is uploaded. See the privacy policy on the extension’s documentation site.
```

---

## 五、检查清单

| 项 | 操作 |
|----|------|
| activeTab 理由 | 在隐私权规范中粘贴上文「activeTab」说明 |
| tabs 理由 | 在隐私权规范中粘贴上文「tabs」说明 |
| alarms 理由 | 在隐私权规范中粘贴上文「alarms」说明（工作流等待步骤） |
| 语言 | 至少选一种语言并填写对应商店说明 |
| 简短说明 / 详细说明 | 复制上面对应语言的文案到商品信息 |
| 隐私政策 URL | 部署文档站后填 `https://<域名>/privacy`，确保公网可访问 |
| 支持/主页 URL | 填文档站首页或 GitHub 等可访问链接 |
