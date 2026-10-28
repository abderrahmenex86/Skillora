import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { env } from '../config/env.js';

export type LlmProvider = 'groq' | 'ollama';

export const DEFAULT_LLM_MODELS: Record<LlmProvider, string> = {
    groq: 'openai/gpt-oss-120b',
    ollama: 'llama3.1:8b',
};

export interface LlmRuntime {
    provider: LlmProvider;
    modelId: string;
    model: LanguageModel;
    temperature: number;
    maxRetries: number;
}

let cachedRuntime: LlmRuntime | null = null;
let warnedAboutMissingConfig = false;

/**
 * A provider is usable when Groq has an API key, or when an Ollama base URL is
 * configured. Agents fall back to their deterministic implementation otherwise.
 */
export function isLlmConfigured(): boolean {
    if (env.LLM_PROVIDER === 'groq') {
        return Boolean(env.GROQ_API_KEY);
    }

    return Boolean(env.OLLAMA_BASE_URL);
}

export function getLlmModelId(provider: LlmProvider = env.LLM_PROVIDER) {
    return env.LLM_MODEL?.trim() || DEFAULT_LLM_MODELS[provider];
}

/**
 * Central model factory. Every agent resolves its model through this function,
 * so switching between Groq and Ollama is a configuration-only change.
 */
export function getLlmRuntime(): LlmRuntime | null {
    if (cachedRuntime) return cachedRuntime;

    if (!isLlmConfigured()) {
        if (!warnedAboutMissingConfig) {
            warnedAboutMissingConfig = true;
            console.warn(
                env.LLM_PROVIDER === 'groq' ?
                    '[agents:llm] GROQ_API_KEY is not set; agents will use deterministic fallbacks.'
                :   '[agents:llm] OLLAMA_BASE_URL is not set; agents will use deterministic fallbacks.'
            );
        }
        return null;
    }

    const provider = env.LLM_PROVIDER;
    const modelId = getLlmModelId(provider);

    try {
        const model =
            provider === 'groq' ?
                createGroq({ apiKey: env.GROQ_API_KEY })(modelId)
            :   createOpenAI({
                    name: 'ollama',
                    baseURL: env.OLLAMA_BASE_URL,
                    apiKey: env.OLLAMA_API_KEY || 'ollama',
                }).chat(modelId);

        cachedRuntime = {
            provider,
            modelId,
            model,
            temperature: env.LLM_TEMPERATURE,
            maxRetries: env.LLM_MAX_RETRIES,
        };

        return cachedRuntime;
    } catch (error) {
        console.warn(
            `[agents:llm] Could not initialize ${provider}/${modelId}: ${describeError(
                error
            )}. Falling back to deterministic agents.`
        );
        return null;
    }
}

export function getLlmModelUsed(runtime: LlmRuntime): string {
    return `llm:${runtime.provider}:${runtime.modelId}`;
}

export function describeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}
