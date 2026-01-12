/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import type { ContentGenerator } from '../contentGenerator.js';
import type {
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponse,
} from '../contentGeneratorTypes.js';

type GoogleAdapterOptions = {
  apiKey?: string;
  vertexai?: boolean;
  httpOptions?: { headers?: Record<string, string> };
};

export class GoogleContentGeneratorAdapter implements ContentGenerator {
  private constructor(private readonly models: GoogleGenAI['models']) {}

  static create(options: GoogleAdapterOptions): GoogleContentGeneratorAdapter {
    const googleGenAI = new GoogleGenAI({
      apiKey: options.apiKey,
      vertexai: options.vertexai,
      httpOptions: options.httpOptions,
    });
    return new GoogleContentGeneratorAdapter(googleGenAI.models);
  }

  async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    return this.models.generateContent(request, userPromptId);
  }

  async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    return this.models.generateContentStream(request, userPromptId);
  }

  async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    return this.models.countTokens(request);
  }

  async embedContent(
    request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    return this.models.embedContent(request);
  }
}
