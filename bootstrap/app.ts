import type { Application } from '@framework/core';
import { auditRoutes } from '@framework/crud';
import { AUDIT_READER } from '@framework/database';
import { defineApp, type FrameworkEnv, forbidden, resolve } from '@framework/http';
import { generateOpenApiDocument, type Operation } from '@framework/openapi';
import { apiPreset, WEBSOCKET_GATEWAY } from '@framework/presets';
import type { Context } from 'hono';
import { notificationDeliveryJob } from '../app/jobs';
import { listeners } from '../app/listeners';
import { notifications } from '../app/notifications';
import type { AppConfig } from '../config';
import { createMiddleware } from './middleware';

export type FrameworkAppApplication = Application<AppConfig>;

/**
 * Database, cache, queue, events, logging, storage, mail, notifications and
 * import/export, configured by `config/index.ts`. Replace a part by passing
 * a provider (`mail: myMailProvider`) or remove it (`data: false`). The
 * import/export routes are denied in production until you pass
 * `data: { authorize: requireAuth() }`.
 */
const api = apiPreset<AppConfig>({
  listeners,
  notifications: { definitions: notifications, job: notificationDeliveryJob },
});

/**
 * The application, registered in one place. Generators add providers and
 * modules below their markers; list order does not matter (boot order comes
 * from each provider's `dependsOn` / `provides` / `requires`).
 *
 * The kernel owns the fixed outer order: request id -> body limit -> request
 * scope -> secure headers (`http.secureHeaders`) -> CORS (`http.corsOrigins`,
 * off when empty). The `api` middleware group (shared throttle) then wraps
 * every module under `/api/v1` and the app routes; `/health` stays outside
 * it so the probes still answer during a Redis outage.
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
    ...api.providers,
    // @framework:providers
  ],
  modules: [
    ...api.modules,
    // @framework:modules
  ],
  health: api.health,
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
