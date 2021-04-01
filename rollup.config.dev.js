import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'esm/index.js',
      format: 'esm',
    },
    // output: {
    //   dir: 'esm',
    //   format: 'esm',
    // },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      typescript({
        target: 'es6',
        outDir: 'esm',
        include: 'src/**/*',
      }),
    ],
  },
];
