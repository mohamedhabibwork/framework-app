import type { FrameworkEnv } from '@framework/http';
import { Hono } from 'hono';
import { dataRoutes } from './data';

/** Versioned API composed from module routes; mounted at /api/v1. */
export const apiRoutes = new Hono<FrameworkEnv>()
  // @framework:routes
  .route('/data', dataRoutes);
