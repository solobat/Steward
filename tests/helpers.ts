/** 极简测试框架（零依赖）：test(name, fn) + run()，断言用 node:assert */
import assert from "node:assert";

const tests: { name: string; fn: () => void | Promise<void> }[] = [];

export function test(name: string, fn: () => void | Promise<void>): void {
  tests.push({ name, fn });
}

export async function run(): Promise<void> {
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${t.name}`);
      console.error(e instanceof Error ? e.stack ?? e.message : e);
    }
  }
  if (failed > 0) {
    console.error(`  ${failed}/${tests.length} FAILED`);
    process.exit(1);
  }
  console.log(`  ${tests.length} passed`);
}

export { assert };
