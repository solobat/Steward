/**
 * 零依赖测试运行器：用 tsx 逐个运行 tests/*.test.ts。
 * 用法：pnpm test
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const testsDir = join(process.cwd(), "tests");
const files = readdirSync(testsDir)
  .filter((f) => f.endsWith(".test.ts"))
  .sort();

if (files.length === 0) {
  console.error("No test files found");
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  console.log(`\n== ${file} ==`);
  const r = spawnSync("pnpm", ["exec", "tsx", join(testsDir, file)], {
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) failed++;
}

if (failed > 0) {
  console.error(`\n${failed}/${files.length} test files FAILED`);
  process.exit(1);
}
console.log(`\nAll ${files.length} test files passed`);
