import { CaptureContext, Event, EventHint, EventProcessor, ScopeLike, Session, Severity } from '@sentry/types';

import { getCurrentClient } from './carrier';

// TODO: Use `ReturnType<ClientLike['captureException']>` instead?
export function captureException(exception: unknown, captureContext?: CaptureContext): string | undefined {
  let syntheticException: Error;
  try {
    throw new Error('Sentry syntheticException');
  } catch (exception) {
    syntheticException = exception as Error;
  }
  const hint = {
    captureContext,
    originalException: exception,
    syntheticException,
  };

  return getCurrentClient()?.captureException(exception, hint);
}

// TODO: Unify the common API and use correct return types
export function captureMessage(message: string, captureContext?: CaptureContext | Severity): string | undefined {
  let syntheticException: Error;
  try {
    throw new Error(message);
  } catch (exception) {
    syntheticException = exception as Error;
  }

  // This is necessary to provide explicit scopes upgrade, without changing the original
  // arity of the `captureMessage(message, level)` method.
  const level = typeof captureContext === 'string' ? captureContext : undefined;
  const context = typeof captureContext !== 'string' ? { captureContext } : undefined;
  const hint = {
    originalException: message,
    syntheticException,
    ...context,
  };
  return getCurrentClient()?.captureMessage(message, level, hint);
}

export function captureEvent(event: Event, hint?: EventHint, scope?: ScopeLike): string | undefined {
  return getCurrentClient()?.captureEvent(event, hint, scope);
}

export function captureSession(session: Session): void {
  return getCurrentClient()?.captureSession?.(session);
}

export function addEventProcessor(callback: EventProcessor): void {
  return getCurrentClient()?.addEventProcessor(callback);
}

export function close(timeout?: number): PromiseLike<boolean> {
  return getCurrentClient()?.close(timeout) || Promise.resolve(false);
}

export function flush(timeout?: number): PromiseLike<boolean> {
  return getCurrentClient()?.flush(timeout) || Promise.resolve(false);
}

export function lastEventId(): string | undefined {
  return getCurrentClient()?.lastEventId();
}
