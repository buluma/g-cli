/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ContentGenerator } from '../contentGenerator.js';
import type {
  ContentListUnion,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponse,
  Part,
} from '../contentGeneratorTypes.js';
import { GenerateContentResponse as GoogleGenerateContentResponse } from '../contentGeneratorTypes.js';
import { toContents } from '../../code_assist/converter.js';
import { estimateTokenCountSync } from '../../utils/tokenCalculation.js';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

export type OpenAIAdapterConfig = {
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
};

type OpenAIChatChunk = {
  id?: string;
  model?: string;
  choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type OpenAIChatResponse = {
  id?: string;
  model?: string;
  choices?: Array<{ message?: { content?: string }; finish_reason?: string | null }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export class OpenAIContentGenerator implements ContentGenerator {
  constructor(private readonly config: OpenAIAdapterConfig) {}

  async generateContent(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const response = await this.fetchJson<OpenAIChatResponse>(
      '/chat/completions',
      {
        model: request.model,
        messages: toOpenAIMessages(request),
        stream: false,
        ...toOpenAIParameters(request),
      },
    );

    return toGenerateContentResponse(response);
  }

  async generateContentStream(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const response = await this.fetchRaw('/chat/completions', {
      model: request.model,
      messages: toOpenAIMessages(request),
      stream: true,
      ...toOpenAIParameters(request),
    });

    if (!response.body) {
      throw new Error('OpenAI streaming response had no body.');
    }

    return streamOpenAIResponse(response.body);
  }

  async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    const parts = toContents(request.contents).flatMap((content) =>
      content.parts ? content.parts : [],
    );
    return { totalTokens: estimateTokenCountSync(parts) };
  }

  async embedContent(
    _request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    throw new Error('Embedding is not supported for OpenAI adapters yet.');
  }

  private async fetchJson<T>(path: string, payload: unknown): Promise<T> {
    const response = await this.fetchRaw(path, payload);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return (await response.json()) as T;
  }

  private async fetchRaw(path: string, payload: unknown): Promise<Response> {
    const baseUrl = this.config.baseUrl ?? DEFAULT_OPENAI_BASE_URL;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    return fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }
}

function toOpenAIParameters(request: GenerateContentParameters): Record<string, unknown> {
  const config = request.config;
  if (!config) {
    return {};
  }

  return {
    temperature: config.temperature,
    top_p: config.topP,
    max_tokens: config.maxOutputTokens,
    stop: config.stopSequences,
    presence_penalty: config.presencePenalty,
    frequency_penalty: config.frequencyPenalty,
    seed: config.seed,
  };
}

function toOpenAIMessages(
  request: GenerateContentParameters,
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];
  const systemInstruction = request.config?.systemInstruction;

  if (systemInstruction) {
    const systemText = contentsToText(systemInstruction as ContentListUnion);
    if (systemText) {
      messages.push({ role: 'system', content: systemText });
    }
  }

  const contentArray = toContents(request.contents);
  for (const entry of contentArray) {
    messages.push({
      role: toOpenAIRole(entry.role),
      content: partsToText(entry.parts ?? []),
    });
  }

  return messages;
}

function toOpenAIRole(role?: string): string {
  if (role === 'model') {
    return 'assistant';
  }
  return role ?? 'user';
}

function partsToText(parts: Part[] | string[]): string {
  return parts.map((part) => partToText(part)).join('');
}

function contentsToText(contents: ContentListUnion): string {
  const contentArray = toContents(contents);
  return contentArray.map((entry) => partsToText(entry.parts ?? [])).join('\n');
}

function partToText(part: Part | string): string {
  if (typeof part === 'string') {
    return part;
  }

  if ('text' in part && part.text) {
    return part.text;
  }

  return '';
}

function toGenerateContentResponse(response: OpenAIChatResponse): GenerateContentResponse {
  const out = new GoogleGenerateContentResponse();
  const text = response.choices?.[0]?.message?.content ?? '';
  out.candidates = text
    ? [
        {
          content: {
            role: 'model',
            parts: [{ text }],
          },
        },
      ]
    : [];
  out.responseId = response.id;
  out.modelVersion = response.model;
  out.usageMetadata = response.usage
    ? {
        promptTokenCount: response.usage.prompt_tokens,
        candidatesTokenCount: response.usage.completion_tokens,
        totalTokenCount: response.usage.total_tokens,
      }
    : undefined;
  return out;
}

async function* streamOpenAIResponse(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<GenerateContentResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) {
        continue;
      }

      const data = trimmed.replace(/^data:\s*/, '');
      if (data === '[DONE]') {
        return;
      }

      let parsed: OpenAIChatChunk | undefined;
      try {
        parsed = JSON.parse(data) as OpenAIChatChunk;
      } catch {
        continue;
      }

      const text = parsed.choices?.[0]?.delta?.content ?? '';
      if (!text) {
        continue;
      }

      const chunk = new GoogleGenerateContentResponse();
      chunk.candidates = [
        {
          content: {
            role: 'model',
            parts: [{ text }],
          },
        },
      ];
      chunk.responseId = parsed.id;
      chunk.modelVersion = parsed.model;
      chunk.usageMetadata = parsed.usage
        ? {
            promptTokenCount: parsed.usage.prompt_tokens,
            candidatesTokenCount: parsed.usage.completion_tokens,
            totalTokenCount: parsed.usage.total_tokens,
          }
        : undefined;
      yield chunk;
    }
  }
}
