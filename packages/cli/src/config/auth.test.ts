/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '@google/gemini-cli-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateAuthMethod } from './auth.js';

const mockIsOpenAiCompatibleAvailable = vi.fn();

vi.mock('@google/gemini-cli-core', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@google/gemini-cli-core')>();
  return {
    ...actual,
    isOpenAiCompatibleContentGeneratorAvailable:
      mockIsOpenAiCompatibleAvailable,
  };
});

vi.mock('./settings.js', () => ({
  loadEnvironment: vi.fn(),
  loadSettings: vi.fn().mockReturnValue({
    merged: vi.fn().mockReturnValue({}),
  }),
}));

describe('validateAuthMethod', () => {
  beforeEach(() => {
    mockIsOpenAiCompatibleAvailable.mockReturnValue(false);
    vi.stubEnv('GEMINI_API_KEY', undefined);
    vi.stubEnv('GOOGLE_CLOUD_PROJECT', undefined);
    vi.stubEnv('GOOGLE_CLOUD_LOCATION', undefined);
    vi.stubEnv('GOOGLE_API_KEY', undefined);
    vi.stubEnv('OPENAI_API_KEY', undefined);
    vi.stubEnv('OPENROUTER_API_KEY', undefined);
    vi.stubEnv('OLLAMA_HOST', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    {
      description: 'should return null for LOGIN_WITH_GOOGLE',
      authType: AuthType.LOGIN_WITH_GOOGLE,
      envs: {},
      expected: null,
    },
    {
      description: 'should return null for COMPUTE_ADC',
      authType: AuthType.COMPUTE_ADC,
      envs: {},
      expected: null,
    },
    {
      description: 'should return null for USE_GEMINI if GEMINI_API_KEY is set',
      authType: AuthType.USE_GEMINI,
      envs: { GEMINI_API_KEY: 'test-key' },
      expected: null,
    },
    {
      description:
        'should return an error message for USE_GEMINI if GEMINI_API_KEY is not set',
      authType: AuthType.USE_GEMINI,
      envs: {},
      expected:
        'When using Gemini API, you must specify the GEMINI_API_KEY environment variable.\n' +
        'Update your environment and try again (no reload needed if using .env)!',
    },
    {
      description:
        'should return null for USE_OPENAI if OPENAI_API_KEY is set',
      authType: AuthType.USE_OPENAI,
      envs: { OPENAI_API_KEY: 'test-openai-key' },
      setup: () => mockIsOpenAiCompatibleAvailable.mockReturnValue(true),
      expected: null,
    },
    {
      description:
        'should return an error message for USE_OPENAI if OPENAI_API_KEY is not set',
      authType: AuthType.USE_OPENAI,
      envs: {},
      setup: () => mockIsOpenAiCompatibleAvailable.mockReturnValue(true),
      expected:
        'When using OpenAI, you must specify the OPENAI_API_KEY environment variable.\n' +
        'Update your environment and try again (no reload needed if using .env)!',
    },
    {
      description:
        'should return an error message for USE_OPENAI if OpenAI-compatible providers are unavailable',
      authType: AuthType.USE_OPENAI,
      envs: { OPENAI_API_KEY: 'test-openai-key' },
      expected: 'OpenAI-compatible providers are not available in this build.',
    },
    {
      description:
        'should return null for USE_OPENROUTER if OPENROUTER_API_KEY is set',
      authType: AuthType.USE_OPENROUTER,
      envs: { OPENROUTER_API_KEY: 'test-openrouter-key' },
      setup: () => mockIsOpenAiCompatibleAvailable.mockReturnValue(true),
      expected: null,
    },
    {
      description:
        'should return an error message for USE_OPENROUTER if OPENROUTER_API_KEY is not set',
      authType: AuthType.USE_OPENROUTER,
      envs: {},
      setup: () => mockIsOpenAiCompatibleAvailable.mockReturnValue(true),
      expected:
        'When using OpenRouter, you must specify the OPENROUTER_API_KEY environment variable.\n' +
        'Update your environment and try again (no reload needed if using .env)!',
    },
    {
      description: 'should return null for USE_OLLAMA if OLLAMA_HOST is set',
      authType: AuthType.USE_OLLAMA,
      envs: { OLLAMA_HOST: 'http://localhost:11434' },
      setup: () => mockIsOpenAiCompatibleAvailable.mockReturnValue(true),
      expected: null,
    },
    {
      description:
        'should return an error message for USE_OLLAMA if OLLAMA_HOST is not set',
      authType: AuthType.USE_OLLAMA,
      envs: {},
      setup: () => mockIsOpenAiCompatibleAvailable.mockReturnValue(true),
      expected:
        'When using Ollama, you must specify the OLLAMA_HOST environment variable.\n' +
        'Update your environment and try again (no reload needed if using .env)!',
    },
    {
      description:
        'should return null for USE_VERTEX_AI if GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION are set',
      authType: AuthType.USE_VERTEX_AI,
      envs: {
        GOOGLE_CLOUD_PROJECT: 'test-project',
        GOOGLE_CLOUD_LOCATION: 'test-location',
      },
      expected: null,
    },
    {
      description:
        'should return null for USE_VERTEX_AI if GOOGLE_API_KEY is set',
      authType: AuthType.USE_VERTEX_AI,
      envs: { GOOGLE_API_KEY: 'test-api-key' },
      expected: null,
    },
    {
      description:
        'should return an error message for USE_VERTEX_AI if no required environment variables are set',
      authType: AuthType.USE_VERTEX_AI,
      envs: {},
      expected:
        'When using Vertex AI, you must specify either:\n' +
        '• GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION environment variables.\n' +
        '• GOOGLE_API_KEY environment variable (if using express mode).\n' +
        'Update your environment and try again (no reload needed if using .env)!',
    },
    {
      description:
        'should return null for OPENAI if OPENAI_API_KEY is set',
      authType: AuthType.OPENAI,
      envs: { OPENAI_API_KEY: 'test-key' },
      expected: null,
    },
    {
      description:
        'should return an error message for OPENAI if OPENAI_API_KEY is not set',
      authType: AuthType.OPENAI,
      envs: {},
      expected:
        'When using OpenAI, you must specify the OPENAI_API_KEY environment variable.\n' +
        'Update your environment and try again (no reload needed if using .env)!',
    },
    {
      description:
        'should return null for OPENROUTER if OPENROUTER_API_KEY is set',
      authType: AuthType.OPENROUTER,
      envs: { OPENROUTER_API_KEY: 'test-key' },
      expected: null,
    },
    {
      description:
        'should return an error message for OPENROUTER if OPENROUTER_API_KEY is not set',
      authType: AuthType.OPENROUTER,
      envs: {},
      expected:
        'When using OpenRouter, you must specify the OPENROUTER_API_KEY environment variable.\n' +
        'Update your environment and try again (no reload needed if using .env)!',
    },
    {
      description: 'should return null for OLLAMA if OLLAMA_HOST is set',
      authType: AuthType.OLLAMA,
      envs: { OLLAMA_HOST: 'http://localhost:11434' },
      expected: null,
    },
    {
      description:
        'should return an error message for OLLAMA if OLLAMA_HOST is not set',
      authType: AuthType.OLLAMA,
      envs: {},
      expected:
        'When using Ollama, you must specify the OLLAMA_HOST environment variable (for example, http://localhost:11434).\n' +
        'Update your environment and try again (no reload needed if using .env)!',
    },
    {
      description: 'should return an error message for an invalid auth method',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authType: 'invalid-method' as any,
      envs: {},
      expected: 'Invalid auth method selected.',
    },
  ])('$description', ({ authType, envs, expected, setup }) => {
    setup?.();
    for (const [key, value] of Object.entries(envs)) {
      vi.stubEnv(key, value as string);
    }
    expect(validateAuthMethod(authType)).toBe(expected);
  });
});
