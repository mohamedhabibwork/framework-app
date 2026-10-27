import { Application } from '@framework/core';
import type { AppConfig } from '../config';
import { providers } from './providers';

export type FrameworkAppApplication = Application<AppConfig>;

/** Builds the framework application. Callers boot it and own its shutdown. */
export function createApplication(config: AppConfig): FrameworkAppApplication {
  return new Application<AppConfig>({ config, providers });
}
