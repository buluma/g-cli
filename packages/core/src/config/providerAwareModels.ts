/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '../core/authTypes.js';
import { resolveModel, DEFAULT_GEMINI_MODEL } from './models.js';

// Default models for each provider
export const PROVIDER_DEFAULT_MODELS: Record<AuthType, string> = {
  [AuthType.LOGIN_WITH_GOOGLE]: DEFAULT_GEMINI_MODEL,
  [AuthType.USE_GEMINI]: DEFAULT_GEMINI_MODEL,
  [AuthType.USE_VERTEX_AI]: DEFAULT_GEMINI_MODEL,
  [AuthType.OPENAI]: 'gpt-4o', // Default OpenAI model
  [AuthType.OPENROUTER]: 'openai/gpt-4o', // Default OpenRouter model
  [AuthType.OLLAMA]: 'llama3', // Default Ollama model
  [AuthType.LEGACY_CLOUD_SHELL]: DEFAULT_GEMINI_MODEL,
  [AuthType.COMPUTE_ADC]: DEFAULT_GEMINI_MODEL,
  [AuthType.USE_OPENAI]: 'gpt-4o',
  [AuthType.USE_OPENROUTER]: 'openai/gpt-4o',
  [AuthType.USE_OLLAMA]: 'llama3',
};

// Available models for each provider
export const PROVIDER_MODELS: Record<AuthType, string[]> = {
  [AuthType.LOGIN_WITH_GOOGLE]: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
  ],
  [AuthType.USE_GEMINI]: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
  ],
  [AuthType.USE_VERTEX_AI]: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
  ],
  [AuthType.OPENAI]: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4',
    'gpt-3.5-turbo',
    'o1-preview',
    'o1-mini',
  ],
  [AuthType.OPENROUTER]: [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'openai/gpt-3.5-turbo',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku',
    'meta-llama/llama-3.1-8b-instruct',
    'meta-llama/llama-3.1-70b-instruct',
    'google/gemini-pro',
    'mistralai/mistral-large',
  ],
  [AuthType.OLLAMA]: [
    'llama3',
    'llama3.1',
    'llama3.2',
    'mistral',
    'mistral-nemo',
    'gemma',
    'gemma2',
    'phi3',
    'command-r',
    'nous-hermes2',
  ],
  [AuthType.LEGACY_CLOUD_SHELL]: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
  ],
  [AuthType.COMPUTE_ADC]: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
  ],
  [AuthType.USE_OPENAI]: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4',
    'gpt-3.5-turbo',
    'o1-preview',
    'o1-mini',
  ],
  [AuthType.USE_OPENROUTER]: [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'openai/gpt-3.5-turbo',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku',
    'meta-llama/llama-3.1-8b-instruct',
    'meta-llama/llama-3.1-70b-instruct',
    'google/gemini-pro',
    'mistralai/mistral-large',
  ],
  [AuthType.USE_OLLAMA]: [
    'llama3',
    'llama3.1',
    'llama3.2',
    'mistral',
    'mistral-nemo',
    'gemma',
    'gemma2',
    'phi3',
    'command-r',
    'nous-hermes2',
  ],
};

/**
 * Gets the default model for a given auth type
 * @param authType The authentication type
 * @returns The default model for that provider
 */
export function getDefaultModelForProvider(authType: AuthType): string {
  return (
    PROVIDER_DEFAULT_MODELS[authType] ||
    PROVIDER_DEFAULT_MODELS[AuthType.USE_GEMINI]
  );
}

/**
 * Gets the available models for a given auth type
 * @param authType The authentication type
 * @returns Array of available models for that provider
 */
export function getModelsForProvider(authType: AuthType): string[] {
  return PROVIDER_MODELS[authType] || PROVIDER_MODELS[AuthType.USE_GEMINI];
}

/**
 * Resolves a model based on the auth type and requested model
 * @param authType The authentication type
 * @param requestedModel The model requested by the user
 * @param previewFeaturesEnabled Whether preview features are enabled
 * @returns The resolved model name
 */
export function resolveModelForProvider(
  authType: AuthType,
  requestedModel: string,
  previewFeaturesEnabled: boolean = false,
): string {
  // For Gemini providers, use the existing resolution logic
  if (
    authType === AuthType.USE_GEMINI ||
    authType === AuthType.USE_VERTEX_AI ||
    authType === AuthType.LOGIN_WITH_GOOGLE ||
    authType === AuthType.LEGACY_CLOUD_SHELL ||
    authType === AuthType.COMPUTE_ADC
  ) {
    return resolveModel(requestedModel, previewFeaturesEnabled);
  }

  // For other providers, return the requested model directly
  // (providers like Ollama, OpenAI, OpenRouter will validate the model themselves)
  return requestedModel;
}
