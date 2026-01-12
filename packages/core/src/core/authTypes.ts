/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AuthType {
  LOGIN_WITH_GOOGLE = 'oauth-personal',
  USE_GEMINI = 'gemini-api-key',
  USE_VERTEX_AI = 'vertex-ai',
  OPENAI = 'openai-api-key-legacy',
  OPENROUTER = 'openrouter-api-key-legacy',
  OLLAMA = 'ollama-legacy',
  LEGACY_CLOUD_SHELL = 'cloud-shell',
  COMPUTE_ADC = 'compute-default-credentials',
  USE_OPENAI = 'openai-api-key',
  USE_OPENROUTER = 'openrouter-api-key',
  USE_OLLAMA = 'ollama',
}
