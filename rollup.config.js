import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

export default [
  // Main library bundle (your existing config)
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.cjs.js', format: 'cjs', sourcemap: true, plugins: [terser()] },
      { file: 'dist/index.esm.js', format: 'esm', sourcemap: true, plugins: [terser()] },
      { file: 'dist/index.min.js', format: 'umd', name: 'fingerprint-oss', plugins: [terser()], sourcemap: true },
    ],
    plugins: [typescript({ tsconfig: './tsconfig.json', useTsconfigDeclarationDir: true })],
    external: [],
  } 
  
];
