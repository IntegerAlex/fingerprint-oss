import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { dts } from 'rollup-plugin-dts';

export default [
  // Main library bundle
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.cjs', format: 'cjs', sourcemap: true, plugins: [terser()], inlineDynamicImports: true },
      { file: 'dist/index.mjs', format: 'esm', sourcemap: true, plugins: [terser()], inlineDynamicImports: true },
      {
        file: 'dist/index.min.js',
        format: 'umd',
        name: 'fingerprintOss', // UMD name, corrected to camelCase
        plugins: [terser()],
        sourcemap: true,
        inlineDynamicImports: true,
        globals: { // Required if any external deps are not bundled for UMD
          // Example: 'hash-wasm': 'hashWasm' 
          // But we aim to bundle it, so this might not be needed if bundling succeeds
        }
      },
    ],
    plugins: [
      typescript({ tsconfig: './tsconfig.build.json' }),
      nodeResolve({ browser: true }), // Resolve node modules, prioritize browser fields
      commonjs(), // Convert CommonJS modules to ES6
    ],
    external: [], // We want to bundle hash-wasm, so it shouldn't be external
  },
  // Single bundled declaration file. `scripts/postbuild.mjs` copies it to
  // index.d.cts for require() consumers (see the exports map in package.json).
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts({ tsconfig: './tsconfig.json' })],
  },
];
