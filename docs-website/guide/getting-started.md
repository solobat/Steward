# 快速开始

## 安装

- 从 **Chrome 网上应用店** 安装 Steward（若已上架），或  
- 从 [GitHub](https://github.com/solobat/Steward) 克隆仓库，在 `v3` 目录下执行 `pnpm install && pnpm run build`，再在 Chrome 的「扩展程序」中「加载已解压的扩展程序」，选择 `v3/dist` 目录。

## 打开命令框

| 方式 | 快捷键 | 说明 |
|------|--------|------|
| 弹窗 | <kbd>⌘</kbd> + <kbd>K</kbd>（Mac） / <kbd>Ctrl</kbd> + <kbd>K</kbd>（Windows） | 点击扩展图标或按快捷键，在弹窗中打开命令框 |
| 页面内 | <kbd>⌘</kbd> + <kbd>J</kbd> / <kbd>Ctrl</kbd> + <kbd>J</kbd> | 在当前网页内嵌入命令框，不离开当前页 |

## 基本用法

1. **输入触发词**：在输入框中输入命令前缀，如 `bm`、`his`、`tab`，会先显示匹配的命令列表；选中一项回车即可进入该命令（如书签列表）。
2. **触发词 + 空格 + 关键词**：例如 `bm 项目` 会进入书签并过滤包含「项目」的结果。
3. **上下键 / Tab**：在列表中移动选中项，<kbd>Enter</kbd> 执行当前项。
4. **Esc**：有输入时先清空输入（或执行「空命令」），输入已空时再按 Esc 关闭命令框。

更多快捷键与命令说明见 [快捷键](/guide/shortcuts) 与 [命令与触发词](/guide/commands)。
