import { defineConfig } from 'vitest/config';

export default defineConfig({
  assetsInclude: ['**/*.csv'],
  test: { include: ['tests/core/**/*.test.ts', 'tests/prototipos/**/*.test.ts'] },
});
