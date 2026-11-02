import { join } from 'node:path';
import { frameworkCommands, runCli } from '@framework/cli';
import { apiProject } from '@framework/presets/cli';
import { app, buildOpenApiDocument } from '../bootstrap/app';
import { createMiddleware } from '../bootstrap/middleware';
import { loadAppConfig } from '../config';

/**
 * Application-local CLI. The conventional layout and config hooks come from
 * `apiProject`; pass `overrides` to change any of them. Exported for embedders
 * (e.g. the MCP server) that invoke commands in-process.
 */
export const project = await apiProject({
  name: 'framework-app',
  frameworkVersion: '0.2.0',
  root: join(import.meta.dir, '..'),
  app,
  loadConfig: loadAppConfig,
  createMiddleware,
  buildOpenApiDocument,
  seeders: async () => (await import('../database/seeders')).seeders,
});

if (import.meta.main) {
  process.exitCode = await runCli({
    argv: process.argv.slice(2),
    project,
    commands: frameworkCommands,
    cliVersion: '0.2.0',
  });
}
