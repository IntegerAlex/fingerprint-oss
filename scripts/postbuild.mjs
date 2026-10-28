/**
 * Post-build: duplicate the bundled declarations for CommonJS consumers.
 *
 * `dist/index.d.ts` is ESM-flavoured (the package is `"type": "module"`), so the
 * `require()` branch of the exports map points at `index.d.cts`. The declaration
 * content is identical — the package only uses named/default exports, never
 * `export =`.
 */
import { copyFile, access } from 'node:fs/promises';

const dts = 'dist/index.d.ts';
const dcts = 'dist/index.d.cts';

await access(dts); // fail loudly if the dts build step didn't run
await copyFile(dts, dcts);

console.log(`postbuild: ${dts} -> ${dcts}`);
