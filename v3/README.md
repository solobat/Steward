# Steward v3

Manifest V3 版本，独立在 `v3/` 目录开发。技术栈：**Vite + React + TypeScript + Tailwind + DaisyUI**。**不含 newtab 功能**。

## 开发

```bash
cd v3
npm install
# 图标：从旧版复制到 public/img（否则扩展会缺图标）
cp ../extension/img/icon16.png ../extension/img/icon48.png ../extension/img/icon128.png public/img/
npm run build
```

在 Chrome 打开 `chrome://extensions` → 加载已解压的扩展程序 → 选择 `v3/dist`。

监听文件变化并重新构建：

```bash
npm run dev
```

## 目录说明

- `src/background.ts` - Service Worker
- `src/popup/` - 弹出层（React）
- `src/options/` - 设置页（React）
- `src/content/` - 注入页面的脚本与样式
- `manifest.json` - MV3 配置（无 newtab、无 chrome_url_overrides）
- `public/img/` - 扩展图标，需从 `../extension/img` 复制

## 当前功能

- **Command+J** / **Ctrl+J**：在当前页面打开命令框（iframe），输入过滤、↑↓ 选择、Enter 执行。
- **Command+K** / **Ctrl+K**：打开扩展图标弹窗（小窗，含「打开设置」）。
- **命令框内置命令**：
  - **当前页信息**：展示标题、URL、Host、Path、Search、Hash、选中文本；选某项 Enter 复制并关闭。
  - **页面链接**：当前页内链接（`a[href]`，最多 80 条），选某项在当前页点击该链接并关闭。
  - **页面大纲**：当前页 h1–h6 标题，选某项滚动到该标题并关闭。
  - **历史记录**：最近访问的页面，选某项在新标签页打开。
  - **书签**：最近添加的书签，选某项在新标签页打开。
  - **打开设置** / **关闭**。
- **设置页**：通用（**速度优先**、**记忆上次命令**）+ 关于；保存后写入 storage。
- **速度优先**：开启后页面加载即注入命令框（打开更快），关闭则首次按快捷键再注入。
- **记忆上次命令**：开启后再次打开命令框会预填上次输入；输入会防抖写入 storage。

## 与旧版关系

- 新功能与 MV3 迁移均在 `v3/` 下进行，不修改根目录下 `extension/` 的旧版代码。
- 后续从 `extension/` 迁移逻辑时，只把需要的部分移植到 v3，并改为 React + 无 eval、无自定义插件执行。
