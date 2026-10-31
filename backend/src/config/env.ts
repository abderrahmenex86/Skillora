import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Neon writes the branch credentials to the repository root (`.env.local` by
// default). Load that first so `neon deploy` stays the source of truth for
// DATABASE_URL / DATABASE_URL_UNPOOLED, then fall back to the backend-local
// file for secrets that are not managed by Neon (JWT keys, LLM keys, ...).
// dotenv never overrides an existing key, so the first file wins.
dotenv.config({
    path: [
        path.resolve(__dirname, '../../../.env.local'),
        path.resolve(__dirname, '../../../.env'),
        path.resolve(__dirname, '../../.env'),
    ],
});

const envSchema = z.object({
    PORT: z.string().default('4000').transform(Number),
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    PUBLIC_SHARE_ORIGIN: z.string().url().optional(),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_ACCESS_SECRET: z
        .string()
        .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z
        .string()
        .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    REDIS_HOST: z.string().default('127.0.0.1'),
    REDIS_PORT: z.string().default('6379').transform(Number),
    REDIS_PASSWORD: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),

    // Multi-provider LLM configuration (Groq or a local Ollama server).
    LLM_PROVIDER: z.enum(['groq', 'ollama']).default('groq'),
    LLM_MODEL: z.string().trim().optional(),
    GROQ_API_KEY: z.string().trim().optional(),
    OLLAMA_BASE_URL: z
        .string()
        .url()
        .default('http://localhost:11434/v1'),
    OLLAMA_API_KEY: z.string().trim().optional(),
    LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
    LLM_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('Invalid environment variables:', parsedEnv.error.format());
    process.exit(1);
}

export const env = parsedEnv.data;
