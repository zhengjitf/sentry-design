import { Scope, Session } from '@sentry/scope';
import { Event, EventHint, EventProcessor, Severity } from '@sentry/types';

import { getCurrentClient } from './carrier';

// TODO: Make client optional and call API through `getCurrentClient()?.method()` (?)
// TODO: Use `ReturnType<ClientLike['captureException']>` instead?
export function captureException(exception: unknown, hint?: EventHint, scope?: Scope): string | undefined {
  return getCurrentClient().captureException(exception, hint, scope);
}

export function captureMessage(message: string, level?: Severity, hint?: EventHint, scope?: Scope): string | undefined {
  return getCurrentClient().captureMessage(message, level, hint, scope);
}

export function captureEvent(event: Event, hint?: EventHint, scope?: Scope): string | undefined {
  return getCurrentClient().captureEvent(event, hint, scope);
}

export function captureSession(session: Session): void {
  return getCurrentClient()?.captureSession?.(session);
}

export function addEventProcessor(callback: EventProcessor): void {
  return getCurrentClient().addEventProcessor(callback);
}

export function close(timeout?: number): PromiseLike<boolean> {
  return getCurrentClient().close(timeout);
}

export function flush(timeout?: number): PromiseLike<boolean> {
  return getCurrentClient().flush(timeout);
}

export function lastEventId(): string | undefined {
  return getCurrentClient().lastEventId();
}
