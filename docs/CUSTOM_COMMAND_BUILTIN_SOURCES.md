# 自定义命令：可内置数据源清单

在「数据来源」中除 **静态列表**、**URL** 外，可增加 **内置数据源** 类型，直接复用扩展已有 API，无需用户配 URL。以下为可行项与实现要点。

---

## 一、已有 Background API、可直接复用的数据源

| 数据源 key | 说明 | 现有 API | 参数 | 映射为 CustomCommandItem |
|------------|------|----------|------|---------------------------|
| **tabs** | 当前焦点窗口的标签页 | `getTabs`（已有） | `query?`：按标题/URL 过滤 | title=标签标题，desc=URL，url=URL；支持 openUrl/复制链接 |
| **history** | 近期浏览历史（约 30 天内、最多 50 条） | `getHistory`（已有） | 无（内部固定 limit） | title=页面标题，url=URL，desc 可空 |
| **bookmarks_recent** | 最近添加/修改的书签（约 20 条） | bm 的 `handleGetBookmarks` → 需在 background 暴露为 `getBookmarks` | 无 | title=书签标题，url=URL |
| **topSites** | Chrome 常用网站 | `getTopSites`（已有） | 无 | title=站点名，url=URL |
| **downloads** | 近期下载列表 | `getDownloads`（已有） | `limit?`（默认 30） | title=文件名，url=下载 URL，desc=状态；选中可 openUrl 或后续扩展「在文件夹中打开」 |
| **extensions** | 已安装扩展列表 | `getExtensions`（已有） | `enabled?: boolean`，`query?`：按名称过滤 | title=扩展名，desc=描述，url=optionsUrl 或 homepageUrl；选中可打开选项页/主页 |

以上均已有或仅需在 background 多暴露一个 action，无需新权限。

---

## 二、需少量新逻辑的数据源

| 数据源 key | 说明 | 实现要点 | 参数 | 映射 |
|------------|------|----------|------|------|
| **bookmarks_folder** | 指定书签文件夹下的所有书签（递归叶子节点） | 新增 `getBookmarkFolder`：`chrome.bookmarks.getChildren(folderId)` 或递归遍历；根目录 id 通常为 `"1"`（书签栏）、`"2"`（其他） | `folderId: string`（如 "1"/"2"，或未来支持「书签栏」等预设） | title=书名标题，url=URL；文件夹节点可跳过或 title=文件夹名、url 空 |
| **history_search** | 按关键词搜索历史 | 使用 `chrome.history.search({ text: filter, maxResults: N })`，当前 his 命令未用；可新加 `searchHistory` action | `maxResults?`（如 30） | 与 history 相同；filter 由用户输入传入 |

---

## 三、推荐实现顺序与配置形态示例

1. **先做「零新增 API」的 5 个**：tabs、history、bookmarks_recent、topSites、extensions（downloads 需确认「打开」语义是否用 url）。
2. **再做 bookmarks_folder**：新增一个 `getBookmarkFolder(folderId)`，可选预设：书签栏 / 其他。
3. **history_search**：可选，与「历史」命令体验一致，仅多一个按 filter 搜索。

配置形态建议（在 `CustomCommandSource` 中增加一种）：

```ts
// 内置数据源：type + 可选参数
| {
    type: "builtin";
    builtin: "tabs" | "history" | "bookmarks_recent" | "bookmarks_folder" | "topSites" | "downloads" | "extensions";
    params?: { folderId?: string; limit?: number; enabled?: boolean };
  }
```

- **filter**：用户输入仍传给 `getResultFromFilter(filter)`；对 tabs/extensions 在扩展侧用 filter 做本地过滤，对 history_search 传进 `chrome.history.search`，其余可做前端二次过滤（或后端一次过滤视 API 而定）。

---

## 四、与「固定动作」的搭配

| 数据源 | 适合的动作 | 说明 |
|--------|-------------|------|
| tabs | openUrl、copy | 用 tab.url 打开或复制 |
| history / bookmarks_* / topSites | openUrl、copy | 同上 |
| downloads | openUrl（下载链接）、未来 runAction 如「在文件夹中打开」 | 当前可先 openUrl 到下载链接 |
| extensions | openUrl | 用 optionsUrl 或 homepageUrl |

复制时可支持模板，例如「复制为 Markdown 链接」：`[{title}]({url})`，与现有 copy 的 template 一致。

---

## 五、小结

| 数据源 | 已有 API | 新增/改动 | 推荐优先级 |
|--------|----------|-----------|------------|
| tabs | ✅ getTabs | 无 | 高 |
| history | ✅ getHistory | 无 | 高 |
| bookmarks_recent | 需 expose getBookmarks | 1 个 case | 高 |
| topSites | ✅ getTopSites | 无 | 中 |
| extensions | ✅ getExtensions | 无 | 中 |
| downloads | ✅ getDownloads | 无 | 中 |
| bookmarks_folder | 无 | getBookmarkFolder + 递归 | 中 |
| history_search | 无 | searchHistory（history.search） | 低 |

以上均可作为自定义命令的「内置数据源」选项，在配置里选类型和少量参数即可，无需用户写 URL 或脚本。
