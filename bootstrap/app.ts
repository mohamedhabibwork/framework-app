import { cacheHealthCheck } from '@framework/cache';
import type { Application } from '@framework/core';
import { auditRoutes, dataOperations } from '@framework/crud';
import { AUDIT_READER, databaseHealthCheck } from '@framework/database';
import { defineApp, defineModule, type FrameworkEnv, forbidden, resolve } from '@framework/http';
import { generateOpenApiDocument, type Operation } from '@framework/openapi';
import { queueHealthCheck } from '@framework/queue';
import type { Context } from 'hono';
import { listenersProvider } from '../app/listeners/listeners.provider';
import { cacheProvider } from '../app/providers/cache.provider';
import { dataProvider } from '../app/providers/data.provider';
import { databaseProvider } from '../app/providers/database.provider';
import { eventsProvider, WEBSOCKET_GATEWAY } from '../app/providers/events.provider';
import { loggingProvider } from '../app/providers/logging.provider';
import { mailProvider } from '../app/providers/mail.provider';
import { notificationsProvider } from '../app/providers/notifications.provider';
import { storageProvider } from '../app/providers/storage.provider';
import type { AppConfig } from '../config';
import { dataRoutes } from '../routes/data';
import { createMiddleware } from './middleware';

export type FrameworkAppApplication = Application<AppConfig>;

/** Queued import/export endpoints under /api/v1/data (see `routes/data.ts`). */
const dataModule = defineModule<AppConfig, Operation>({
  name: 'data',
  routes: { path: '/data', app: dataRoutes },
  operations: dataOperations({ mount: '/api/v1/data' }),
});

/**
 * The application, registered in one place. Generators add providers and
 * modules below their markers; list order does not matter (boot order comes
 * from each provider's `dependsOn` / `provides` / `requires`).
 *
 * The kernel owns the fixed outer order: request id -> body limit -> request
 * scope -> secure headers (`http.secureHeaders`) -> CORS (`http.corsOrigins`,
 * off when empty). The `api` middleware group (shared throttle) then wraps
 * `/health`, every module under `/api/v1`, and the app routes.
 *
 * Audit endpoints (`/audit`) are denied in production until an
 * identity/authorization layer exists. The `/ws` gateway opens private
 * `user.<id>` channels for authenticated actors and broadcasts presence.
 * Replace any binding with `overrides: (container) => container.override(…)`.
 */
export const app = defineApp<AppConfig, Operation>({
  http: (config) => ({
    exposeInternalErrors: config.app.debug && config.app.env !== 'production',
    maxBodyBytes: config.http.maxBodyBytes,
    secureHeaders: config.http.secureHeaders,
    cors: { origins: config.http.corsOrigins },
    report: (error, context) => console.error('[http] unhandled error', context, error),
  }),
  middleware: (config) => createMiddleware(config).resolve(['api']),
  providers: [
    cacheProvider,
    loggingProvider,
    storageProvider,
    databaseProvider,
    eventsProvider,
    listenersProvider,
    dataProvider,
    mailProvider,
    notificationsProvider,
    // @framework:providers
  ],
  modules: [
    dataModule,
    // @framework:modules
  ],
  health: { checks: [databaseHealthCheck(), cacheHealthCheck(), queueHealthCheck()] },
  routes: (http, { config, container }) => {
    // @framework:app-routes
    http.route(
      '/audit',
      auditRoutes({
        authorize: (_c: Context<FrameworkEnv>) => {
          if (config.app.env === 'production') throw forbidden('Audit endpoints require authorization');
        },
        reader: (c: Context<FrameworkEnv>) => resolve(c, AUDIT_READER),
      }),
    );
    http.route('/ws', container.resolve(WEBSOCKET_GATEWAY).routes());
  },
});

/** Builds the framework application with overrides applied. Callers boot it and own its shutdown. */
export const createApplication = (config: AppConfig): FrameworkAppApplication => app.createApplication(config);

/**
 * The HTTP app. Hono RPC clients type against a module's routes, e.g.
 * `hc<typeof productRoutes>('/api/v1/products')`.
 */
export const createHttp = (application: FrameworkAppApplication) => app.createHttp(application);

/** Session auth is a cookie; API clients authenticate with Bearer tokens. */
const securitySchemes = {
  sessionCookie: { type: 'apiKey', in: 'cookie', name: 'fw_session' },
  bearerAuth: { type: 'http', scheme: 'bearer' },
} as const;

export function buildOpenApiDocument(version = '1.0.0') {
  return generateOpenApiDocument({ title: 'Framework App API', version, operations: app.operations, securitySchemes });
}
