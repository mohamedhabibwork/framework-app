import type { Listener } from '@framework/presets';

export type { Listener };

/**
 * `apiPreset` subscribes every entry below the marker when the application
 * boots. Delivery is at-least-once: keep handlers idempotent. Add listeners
 * with `make:listener`.
 */
export const listeners: Listener[] = [
  // @framework:listeners
];
