/**
 * 打包 v3：把 dist/ 的内容（manifest.json 在根级）打成 zip，文件名带版本号。
 * 用法：pnpm run build && node scripts/pack.mjs（或 pnpm run prod）
 */
import { createRequire } from "module";
import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { join } from "path";

const require = createRequire(import.meta.url);
const { name, version } = require("../package.json");
const distDir = join(process.cwd(), "dist");
const outName = `${name}-${version}.zip`;
const outPath = join(process.cwd(), outName);

if (!existsSync(distDir)) {
  console.error("dist/ 不存在，请先执行 pnpm run build");
  process.exit(1);
}

if (existsSync(outPath)) rmSync(outPath);

// 在 dist 内打包内容（manifest.json 位于 zip 根级，符合 Chrome 商店上传要求）
execSync(`zip -rq "${outPath}" . -x "*.map"`, {
  cwd: distDir,
  stdio: "inherit",
});

console.log("已生成:", outName);
