import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts', // Ensure this points to your main entry file
  output: [
    {
      file: 'dist/index.cjs.js', // CommonJS output file
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js', // ES Module output file
      format: 'esm',
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

