import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import del from 'rollup-plugin-delete';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'esm/index.js',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'esm/index.min.js',
        format: 'esm',
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      typescript({
        sourceMap: true,
        outDir: 'esm',
        include: 'src/**/*',
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'cjs/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'cjs/index.min.js',
        format: 'cjs',
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      typescript({
        sourceMap: true,
        target: 'es5',
        outDir: 'cjs',
        include: 'src/**/*',
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'types',
      },
    ],
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      typescript({
        rootDir: './',
        declaration: true,
        outDir: 'types',
        include: 'src/**/*',
      }),
    ],
  },
  {
    input: './types/src/index.d.ts',
    output: [
      {
        file: 'types/index.d.ts',
      },
    ],
    plugins: [
      dts(),
      del({
        targets: ['types/src', 'types/index.js'],
        hook: 'buildEnd',
      }),
    ],
  },
];
