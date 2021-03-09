import { SentryEvent, EventHint } from './event';

/**
 * SentryEvent processors are used to change the event before it will be send.
 * We strongly advise to make this function sync.
 * Returning a PromiseLike<SentryEvent | null> will work just fine, but better be sure that you know what you are doing.
 * SentryEvent processing will be deferred until your Promise is resolved.
 */
export type EventProcessor = (
  event: SentryEvent,
  hint?: EventHint,
) => PromiseLike<SentryEvent | null> | SentryEvent | null;
