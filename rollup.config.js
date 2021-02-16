import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'cjs',
      format: 'cjs',
      sourcemap: false,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: false,
        declarationMap: false,
        inlineSources: false,
        sourceMap: false,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      dir: 'esm',
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ declaration: true, declarationDir: 'esm', inlineSources: false, sourceMap: false, rootDir: 'src' }),
    ],
  },
  {
    input: './esm/index.d.ts',
    output: [{ file: 'index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
];
