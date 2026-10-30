import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/commands/**/*.ts',
    'src/events/**/*.ts',
    'src/interactions/**/*.ts'
  ],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: false,
  esbuildOptions(options) {
    options.alias = { '@': './src' }
  }
})
