import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().optional(),
  BASE_WEBHOOK_URL: z.string().url().optional(),
  ENABLE_WEBHOOK: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  ENABLE_WEBSOCKET: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  ENABLE_SWAGGER: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  MAX_ATTACHMENT_SIZE: z.coerce.number().int().positive().default(10485760),
  SET_MESSAGES_AS_SEEN: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  DISABLED_CALLBACKS: z.string().default('').transform(v => 
    v ? new Set(v.split('|').map(s => s.trim()).filter(Boolean)) : new Set<string>()
  ),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1000),
  RECOVER_SESSIONS: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  SESSIONS_PATH: z.string().default('./sessions'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  BASE_PATH: z.string().default('/'),
  CORS_ORIGINS: z.string().default('*'),
  TRUST_PROXY: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
});

type Config = z.infer<typeof configSchema>;

const envVars = {
  PORT: process.env.PORT,
  API_KEY: process.env.API_KEY,
  BASE_WEBHOOK_URL: process.env.BASE_WEBHOOK_URL,
  ENABLE_WEBHOOK: process.env.ENABLE_WEBHOOK,
  ENABLE_WEBSOCKET: process.env.ENABLE_WEBSOCKET,
  ENABLE_SWAGGER: process.env.ENABLE_SWAGGER,
  MAX_ATTACHMENT_SIZE: process.env.MAX_ATTACHMENT_SIZE,
  SET_MESSAGES_AS_SEEN: process.env.SET_MESSAGES_AS_SEEN,
  DISABLED_CALLBACKS: process.env.DISABLED_CALLBACKS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RECOVER_SESSIONS: process.env.RECOVER_SESSIONS,
  SESSIONS_PATH: process.env.SESSIONS_PATH,
  LOG_LEVEL: process.env.LOG_LEVEL,
  BASE_PATH: process.env.BASE_PATH,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  TRUST_PROXY: process.env.TRUST_PROXY,
};

const parsed = configSchema.parse(envVars);

export const config: Config = parsed;
export default config;
