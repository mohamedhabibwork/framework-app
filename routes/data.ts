import { EXECUTION_CONTEXT } from '@framework/core';
import { importExportRoutes } from '@framework/crud';
import { forbidden, resolve } from '@framework/http';
import { DATA_PORTER } from '../app/providers/data.tokens';
import { loadAppConfig } from '../config';

// Loaded once; the authorization guard reads the validated env from it.
const configPromise = loadAppConfig();
/**
 * Queued import/export endpoints (documented via `dataOperations` in
 * `bootstrap/openapi.ts`):
 *
 * ```text
 * POST /api/v1/data/import                 dispatch an import (CSV/JSON)
 * GET  /api/v1/data/import/status/:jobId   job state and row errors
 * POST /api/v1/data/export                 dispatch an export
 * GET  /api/v1/data/export/status/:jobId   job state and progress
 * GET  /api/v1/data/export/download/:jobId the finished artifact
 * ```
 *
 * Import/export touches every resource, so it is denied in production until
 * an authorization layer is wired: replace this guard with e.g.
 * `requireAuth()` or `requireAbility('data.import')` once auth exists.
 */
export const dataRoutes = importExportRoutes({
  porter: (c) => resolve(c, DATA_PORTER),
  execution: (c) => resolve(c, EXECUTION_CONTEXT),
  authorize: async () => {
    const config = await configPromise;
    if (config.app.env === 'production') throw forbidden('Import/export endpoints require authorization');
  },
});
