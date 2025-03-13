import typescript from 'rollup-plugin-typescript2';
import  terser  from '@rollup/plugin-terser'; // Use the new official plugin

export default {
  input: 'src/index.ts', // Ensure this points to your main entry file
  output: [
    {
      file: 'dist/index.cjs.js', // CommonJS output file
      format: 'cjs',
      sourcemap: true,
      plugins: [terser()] // Minify the CommonJS output
    },
    {
      file: 'dist/index.esm.js', // ES Module output file
      format: 'esm',
      sourcemap: true,
      plugins: [terser()] // Minify the ES Module output
    },
    {
      file: 'dist/index.min.js', // Minified output file
      format: 'umd', // Universal Module Definition (could also use iife or esm depending on needs)
      name: 'fingerprint-oss', // Name of your library in the global scope
      plugins: [terser()], // Minify this version
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json', // Ensure this path is correct
      useTsconfigDeclarationDir: true,
    }),
  ],
  external: [], // Add any external dependencies here
};

