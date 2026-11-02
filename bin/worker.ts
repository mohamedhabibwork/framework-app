import { QueueManager, runWorker } from '@framework/queue';
import { jobs } from '../app/jobs';
import { createApplication } from '../bootstrap/app';
import { loadAppConfig } from '../config';

const config = await loadAppConfig();
const application = await createApplication(config).boot();

// Drains in-flight jobs on SIGTERM/SIGINT, then shuts the application down.
runWorker({
  application,
  queue: new QueueManager({ url: config.redis.url, prefix: config.queue.prefix, queue: config.queue.name }),
  jobs,
  concurrency: config.queue.concurrency,
  shutdownTimeoutMs: config.http.shutdownTimeoutMs,
});
