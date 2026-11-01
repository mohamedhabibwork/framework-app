import type { ServiceProvider } from '@framework/core';
import { listenersProvider } from '../app/listeners/listeners.provider';
import { cacheProvider } from '../app/providers/cache.provider';
import { dataProvider } from '../app/providers/data.provider';
import { databaseProvider } from '../app/providers/database.provider';
import { eventsProvider } from '../app/providers/events.provider';
import { loggingProvider } from '../app/providers/logging.provider';
import { mailProvider } from '../app/providers/mail.provider';
import { notificationsProvider } from '../app/providers/notifications.provider';
import { storageProvider } from '../app/providers/storage.provider';
import type { AppConfig } from '../config';

/**
 * Explicit provider registration. List order does not matter: boot order is
 * resolved from `dependsOn` and the tokens each provider `provides` /
 * `requires` / uses (`optional`).
 */
export const providers: readonly ServiceProvider<AppConfig>[] = [
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
];
