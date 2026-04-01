import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  // Main library bundle
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.cjs.js', format: 'cjs', sourcemap: true, plugins: [terser()], inlineDynamicImports: true },
      { file: 'dist/index.esm.js', format: 'esm', sourcemap: true, plugins: [terser()], inlineDynamicImports: true },
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
      typescript({ tsconfig: './tsconfig.json' }),
      nodeResolve({ browser: true }), // Resolve node modules, prioritize browser fields
      commonjs(), // Convert CommonJS modules to ES6
    ],
    external: [], // We want to bundle hash-wasm, so it shouldn't be external
  }
];
