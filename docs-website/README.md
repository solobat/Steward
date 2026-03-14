# Steward v3 文档站

基于 [VitePress](https://vitepress.dev/) 的官网与文档。

## 开发

在项目根目录 `v3` 下执行：

```bash
pnpm install
pnpm docs:dev
```

浏览器访问默认地址（如 `http://localhost:5173`）。

## 构建

```bash
pnpm docs:build
```

静态输出在 `docs-website/.vitepress/dist`。

## 预览构建结果

```bash
pnpm docs:preview
```

## 目录说明

- `index.md` - 首页
- `guide/` - 教程（快速开始、快捷键、命令、搜索、工作流、设置）
- `privacy.md` - 隐私政策
- `.vitepress/config.ts` - 站点配置
- `public/` - 静态资源（如 icon.svg）

## 部署到 Vercel（无需改目录）

1. 在 Vercel 中导入本仓库。
2. **Root Directory** 设为 **`v3`**（不要选仓库根或 `docs-website`）。
3. `v3/vercel.json` 已配置：构建命令 `pnpm run docs:build`，输出目录 `docs-website/.vitepress/dist`，一般无需再填。
4. 若站点部署在子路径（如 `https://xxx.vercel.app/Steward/`），在 `.vitepress/config.ts` 里将 `base` 改为 `'/Steward/'`。
