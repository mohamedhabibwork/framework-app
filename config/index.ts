import { type DefineConfigLoadOptions, defineConfig, fromEnv, type InferConfig } from '@framework/core';
import { smtpConfigSection } from '@framework/mail';
import { z } from 'zod/v4';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

/** One schema per setting, bound to its variable. Precedence: process env > env file > defaults. */
export const appConfig = defineConfig({
  app: z.object({
    name: fromEnv('APP_NAME', z.string().min(1).default('framework-app')),
    env: fromEnv('APP_ENV', z.enum(['development', 'test', 'production']).default('development')),
    debug: fromEnv('APP_DEBUG', booleanString.default(false)),
  }),
  http: z.object({
    host: fromEnv('HTTP_HOST', z.string().min(1).default('127.0.0.1')),
    port: fromEnv('HTTP_PORT', z.coerce.number().int().min(0).max(65535).default(3000)),
    corsOrigins: fromEnv(
      'CORS_ORIGINS',
      z
        .string()
        .default('')
        .transform((value) =>
          value
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean),
        ),
    ),
    maxBodyBytes: fromEnv(
      'HTTP_MAX_BODY_BYTES',
      z.coerce
        .number()
        .int()
        .min(1)
        .default(1024 * 1024),
    ),
    secureHeaders: fromEnv('HTTP_SECURE_HEADERS', booleanString.default(true)),
    throttle: z.object({
      enabled: fromEnv('HTTP_THROTTLE_ENABLED', booleanString.default(true)),
      limit: fromEnv('HTTP_THROTTLE_LIMIT', z.coerce.number().int().min(1).default(120)),
      windowSeconds: fromEnv('HTTP_THROTTLE_WINDOW_SECONDS', z.coerce.number().int().min(1).default(60)),
    }),
    shutdownTimeoutMs: fromEnv('SHUTDOWN_TIMEOUT_MS', z.coerce.number().int().min(100).default(10_000)),
  }),
  database: z.object({
    url: fromEnv('DATABASE_URL', z.url({ protocol: /^postgres(ql)?$/ })),
    maxConnections: fromEnv('DATABASE_MAX_CONNECTIONS', z.coerce.number().int().min(1).max(100).default(10)),
    migrationsFolder: fromEnv('DATABASE_MIGRATIONS_FOLDER', z.string().default('database/migrations')),
  }),
  redis: z.object({
    url: fromEnv('REDIS_URL', z.url({ protocol: /^redis$/ }).default('redis://127.0.0.1:6379')),
  }),
  queue: z.object({
    name: fromEnv('QUEUE_NAME', z.string().min(1).default('default')),
    concurrency: fromEnv('QUEUE_CONCURRENCY', z.coerce.number().int().min(1).max(64).default(4)),
    prefix: fromEnv('QUEUE_PREFIX', z.string().min(1).default('framework-app')),
  }),
  events: z.object({
    driver: fromEnv('EVENTS_DRIVER', z.enum(['memory', 'redis']).default('memory')),
  }),
  cache: z.object({
    driver: fromEnv('CACHE_DRIVER', z.enum(['memory', 'redis']).default('redis')),
    redis: z.object({
      url: fromEnv('CACHE_REDIS_URL', z.url({ protocol: /^redis$/ }).default('redis://127.0.0.1:6379')),
      prefix: fromEnv('CACHE_REDIS_PREFIX', z.string().min(1).default('framework-app')),
    }),
  }),
  logging: z.object({
    level: fromEnv('LOG_LEVEL', z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info')),
    driver: fromEnv('LOG_DRIVER', z.enum(['console', 'file', 'memory']).default('console')),
    name: fromEnv('LOG_NAME', z.string().min(1).default('framework-app')),
    filePath: fromEnv('LOG_FILE_PATH', z.string().min(1).optional()),
    maxBytes: fromEnv('LOG_MAX_BYTES', z.coerce.number().int().positive().optional()),
  }),
  storage: z.object({
    default: fromEnv('STORAGE_DEFAULT', z.string().min(1).default('local')),
    disks: z.object({
      local: z.object({
        driver: z.literal('local').default('local'),
        root: fromEnv('STORAGE_ROOT', z.string().min(1).default('storage')),
        visibility: fromEnv('STORAGE_VISIBILITY', z.enum(['private', 'public']).default('private')),
      }),
    }),
  }),
  mail: z.object({
    driver: fromEnv('MAIL_DRIVER', z.enum(['console', 'memory', 'smtp']).default('console')),
    from: fromEnv('MAIL_FROM', z.string().trim().toLowerCase().email().default('no-reply@framework-app.local')),
    smtp: smtpConfigSection(),
  }),
  notifications: z.object({
    providers: z
      .object({
        push: z
          .object({
            type: fromEnv('NOTIFICATIONS_PUSH_TYPE', z.string().trim().min(1)),
            target: z.string().trim().min(1).optional(),
            options: z.record(z.string(), z.unknown()).optional(),
          })
          .optional(),
        messaging: z
          .object({
            type: fromEnv('NOTIFICATIONS_MESSAGING_TYPE', z.string().trim().min(1)),
            target: z.string().trim().min(1).optional(),
            options: z.record(z.string(), z.unknown()).optional(),
          })
          .optional(),
      })
      .optional(),
  }),
  // @framework:config-schema-sections
});

export type AppConfig = InferConfig<typeof appConfig>;

export const loadAppConfig = (options?: DefineConfigLoadOptions) => appConfig.load(options);
