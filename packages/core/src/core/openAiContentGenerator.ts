/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from './contentGenerator.js';

export type OpenAiCompatibleProvider = 'openai' | 'openrouter' | 'ollama';

export async function createOpenAiCompatibleContentGenerator(
  provider: OpenAiCompatibleProvider,
  _config: ContentGeneratorConfig,
  _gcConfig: Config,
  _sessionId?: string,
): Promise<ContentGenerator> {
  throw new Error(
    `OpenAI-compatible provider "${provider}" is not available in this build.`,
  );
}
