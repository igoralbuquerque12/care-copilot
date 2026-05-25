import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ENVIRONMENT: z.enum(["development", "staging", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    APP_URL: z.string().url(),
    GEMINI_API_KEY: z.string().min(1),
    GROQ_API_KEY: z.string().min(1),
    GROQ_STT_MODEL: z.string().default("whisper-large-v3"),
    GROQ_LLM_AUDIO_MODEL: z.string().default("meta-llama/llama-4-scout-17b-16e-instruct"),
    GROQ_LLM_SMART_MODEL: z.string().default("meta-llama/llama-4-maverick-17b-128e-instruct"),
    OPENAI_API_KEY: z.string().optional(),
    QSTASH_URL: z.string().url(),
    QSTASH_TOKEN: z.string().optional(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
  },

  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },

  runtimeEnv: {
    ENVIRONMENT: process.env.ENVIRONMENT,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    APP_URL: process.env.APP_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_STT_MODEL: process.env.GROQ_STT_MODEL,
    GROQ_LLM_AUDIO_MODEL: process.env.GROQ_LLM_AUDIO_MODEL,
    GROQ_LLM_SMART_MODEL: process.env.GROQ_LLM_SMART_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    QSTASH_URL: process.env.QSTASH_URL,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});