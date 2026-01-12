/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const coreEntry = path.resolve(currentDir, '../core/src/index.ts');
const coreSrc = path.resolve(currentDir, '../core/src');

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@google\/gemini-cli-core$/,
        replacement: coreEntry,
      },
      {
        find: /^@google\/gemini-cli-core\/src\/(.*)$/,
        replacement: `${coreSrc}/$1`,
      },
    ],
  },
});
