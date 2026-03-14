# Steward v3 框架检查清单

## 一、已检查项 ✅

| 项目 | 状态 |
|------|------|
| **Manifest** | MV3；permissions 含 storage / history / bookmarks / tabs / clipboardWrite；commands 含 _execute_action、open-in-content-page；content_scripts、options_ui、web_accessible_resources 正确 |
| **Background** | onMessage 处理 getConfig / getData / getHistory / getBookmarks / saveLastQuery / getLastQuery / saveConfig；getHistory / getBookmarks 委托 commands 实现；onCommand 发 openBox |
| **Content** | 单例 iframe、openBox/closeBox、stewardFocus；postMessage 分发到 meta/nav/outline 的 content 模块；speedFirst 提前 init |
| **Popup/CmdBox** | 从 `../commands` 取 TRIGGERS；loadForMode 调用 command.load(ctx)；handleSelect 调用 command.execute；META/NAVS/OUTLINE 消息更新 subList/items；箭头键用 ref + 容器 keydown 捕获；选中项 scrollIntoView；DEBUG 已关 |
| **Options** | General（speedFirst、cacheLastCmd）读写 config，mergeConfig + DEFAULT_CONFIG |
| **Commands 结构** | 每命令一目录；meta/nav/outline 有 index + content；his/bm 有 index + background；settings/close 仅 index；types 与 index 汇总 TRIGGERS |
| **类型与默认配置** | `src/types/config.ts` 提供 AppConfig、DEFAULT_CONFIG；与 options 一致 |
| **图标** | `public/img/` 下有 icon16/48/128，构建后可用 |

## 二、已处理的小遗漏

- **CmdBox 调试**：`DEBUG` 已设为 `false`，并移除/收敛 his、arrows 的 `console.log`，需要时再改为 `true` 即可。

## 三、后续可做（非阻断）

- **his 在 iframe 内无数据**：已用 600ms 延迟从 storage 读；若仍无数据可再排查权限或上下文（见此前 todo）。
- **i18n / _locales**：当前未做，上架时可补。
- **新命令**：在 `src/commands/` 下新建目录，补 `index.ts`，必要时加 `background.ts` 或 `content.ts`，并在 `commands/index.ts` 中注册。

## 四、发布前自测建议

1. `cd v3 && pnpm install && pnpm run build`，在 Chrome 加载 `dist`。
2. Command+J 打开框 → 依次试 meta / nav / outline / his / bm / settings / close。
3. 空命令下 ↑↓ 选择、Enter 执行；列表多时确认选中项自动滚入可视区。
4. 设置页修改「速度优先」「记忆上次命令」并保存，关闭再打开看预填。
