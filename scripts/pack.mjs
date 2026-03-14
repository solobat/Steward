/**
 * 仅打包 v3：对根目录 dist/ 打 zip，文件名带版本号。不涉及 v2。
 */
import { createRequire } from "module";
import { execSync } from "child_process";
import { existsSync } from "fs";

const require = createRequire(import.meta.url);
const { name, version } = require("../package.json");
const distDir = "dist";
const outName = `${name}-${version}.zip`;

if (!existsSync(distDir)) {
  console.error("dist/ 不存在，请先执行 pnpm run build（仅构建 v3）");
  process.exit(1);
}

execSync(`zip -rq "${outName}" "${distDir}"`, { stdio: "inherit" });
console.log("已生成:", outName);
