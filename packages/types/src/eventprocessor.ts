import { SentryEvent, EventHint } from './event';

/**
 * SentryEvent processors are used to change the event before it will be send.
 */
export type EventProcessor = (event: SentryEvent, hint?: EventHint) => SentryEvent | null;
