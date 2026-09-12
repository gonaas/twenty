import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node24',
  outDir: 'dist',
  clean: true,
  external: ['playwright'],
  // node:sqlite is not in esbuild's builtin list; stripping the prefix would
  // turn it into a lookup for an npm package called "sqlite".
  removeNodeProtocol: false,
});
