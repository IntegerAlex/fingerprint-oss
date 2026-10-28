/**
 * Bundle-size budget. Fails CI when a published bundle grows past its gzip
 * budget, so a new dependency or a stray import can't slip through unnoticed.
 *
 * Budgets are gzip bytes. Raise them deliberately, in the same commit that
 * justifies the growth.
 */
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const BUDGETS = {
  'dist/index.mjs': 44 * 1024,
  'dist/index.cjs': 44 * 1024,
  'dist/index.min.js': 44 * 1024,
};

let failed = false;

for (const [file, budget] of Object.entries(BUDGETS)) {
  const gzipped = gzipSync(await readFile(file)).length;
  const ok = gzipped <= budget;
  const pct = ((gzipped / budget) * 100).toFixed(0);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${file.padEnd(20)} ${(gzipped / 1024).toFixed(1)} KB gzip (${pct}% of ${(budget / 1024).toFixed(0)} KB budget)`);
  if (!ok) failed = true;
}

if (failed) {
  console.error('\nBundle size budget exceeded. Shrink the change or raise the budget deliberately.');
  process.exit(1);
}
