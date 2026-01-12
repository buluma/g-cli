/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenAIContentGenerator } from './openaiContentGenerator.js';
import type { ContentGenerator } from '../contentGenerator.js';

export class OpenRouterContentGenerator implements ContentGenerator {
  private readonly adapter: OpenAIContentGenerator;

  constructor(config: { apiKey?: string; baseUrl?: string }) {
    this.adapter = new OpenAIContentGenerator({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      headers: {
        'HTTP-Referer': 'https://github.com/google-gemini/gemini-cli',
        'X-Title': 'Gemini CLI',
      },
    });
  }

  generateContent(...args: Parameters<ContentGenerator['generateContent']>) {
    return this.adapter.generateContent(...args);
  }

  generateContentStream(
    ...args: Parameters<ContentGenerator['generateContentStream']>
  ) {
    return this.adapter.generateContentStream(...args);
  }

  countTokens(...args: Parameters<ContentGenerator['countTokens']>) {
    return this.adapter.countTokens(...args);
  }

  embedContent(...args: Parameters<ContentGenerator['embedContent']>) {
    return this.adapter.embedContent(...args);
  }
}
