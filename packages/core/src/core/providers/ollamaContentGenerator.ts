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
import { GenerateContentResponse as GoogleGenerateContentResponse } from '@google/genai';
import { toContents } from '../../code_assist/converter.js';
import { estimateTokenCountSync } from '../../utils/tokenCalculation.js';

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

type OllamaConfig = {
  baseUrl?: string;
};

type OllamaResponse = {
  model?: string;
  created_at?: string;
  message?: { role?: string; content?: string };
  done?: boolean;
  done_reason?: string;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
};

export class OllamaContentGenerator implements ContentGenerator {
  constructor(private readonly config: OllamaConfig) {}

  async generateContent(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const response = await this.fetchJson<OllamaResponse>('/api/chat', {
      model: request.model,
      messages: toOllamaMessages(request),
      stream: false,
    });

    return toGenerateContentResponse(response);
  }

  async generateContentStream(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const response = await this.fetchRaw('/api/chat', {
      model: request.model,
      messages: toOllamaMessages(request),
      stream: true,
    });

    if (!response.body) {
      throw new Error('Ollama streaming response had no body.');
    }

    return streamOllamaResponse(response.body);
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
    throw new Error('Embedding is not supported for Ollama adapters yet.');
  }

  private async fetchJson<T>(path: string, payload: unknown): Promise<T> {
    const response = await this.fetchRaw(path, payload);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return (await response.json()) as T;
  }

  private async fetchRaw(path: string, payload: unknown): Promise<Response> {
    const baseUrl = this.config.baseUrl ?? DEFAULT_OLLAMA_BASE_URL;
    return fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }
}

function toOllamaMessages(
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
      role: toOllamaRole(entry.role),
      content: partsToText(entry.parts ?? []),
    });
  }

  return messages;
}

function toOllamaRole(role?: string): string {
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

function toGenerateContentResponse(
  response: OllamaResponse,
): GenerateContentResponse {
  const out = new GoogleGenerateContentResponse();
  const text = response.message?.content ?? '';
  out.candidates = text
    ? [
        {
          content: {
            role: normalizeOllamaResponseRole(response.message?.role),
            parts: [{ text }],
          },
        },
      ]
    : [];
  out.modelVersion = response.model;
  out.usageMetadata =
    response.prompt_eval_count !== undefined ||
    response.eval_count !== undefined
      ? {
          promptTokenCount: response.prompt_eval_count,
          candidatesTokenCount: response.eval_count,
          totalTokenCount:
            response.prompt_eval_count !== undefined &&
            response.eval_count !== undefined
              ? response.prompt_eval_count + response.eval_count
              : undefined,
        }
      : undefined;
  return out;
}

function normalizeOllamaResponseRole(role?: string): string {
  if (role === 'assistant') {
    return 'model';
  }
  return role ?? 'model';
}

async function* streamOllamaResponse(
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
      if (!trimmed) {
        continue;
      }

      let parsed: OllamaResponse | undefined;
      try {
        parsed = JSON.parse(trimmed) as OllamaResponse;
      } catch {
        continue;
      }

      if (!parsed.message?.content) {
        continue;
      }

      const chunk = new GoogleGenerateContentResponse();
      chunk.candidates = [
        {
          content: {
            role: normalizeOllamaResponseRole(parsed.message.role),
            parts: [{ text: parsed.message.content }],
          },
        },
      ];
      chunk.modelVersion = parsed.model;
      chunk.usageMetadata =
        parsed.prompt_eval_count !== undefined ||
        parsed.eval_count !== undefined
          ? {
              promptTokenCount: parsed.prompt_eval_count,
              candidatesTokenCount: parsed.eval_count,
              totalTokenCount:
                parsed.prompt_eval_count !== undefined &&
                parsed.eval_count !== undefined
                  ? parsed.prompt_eval_count + parsed.eval_count
                  : undefined,
            }
          : undefined;
      yield chunk;

      if (parsed.done) {
        return;
      }
    }
  }
}
