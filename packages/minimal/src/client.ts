import { CaptureContext, SentryEvent, EventProcessor, Session } from '@sentry/types';

import { getCurrentClient } from './carrier';

// TODO: Use `ReturnType<ClientLike['captureException']>` instead?
export function captureException(exception: unknown, captureContext: CaptureContext = {}): string | undefined {
  try {
    throw new Error('Sentry syntheticException');
  } catch (syntheticException) {
    captureContext.hint = captureContext.hint ?? {};
    captureContext.hint.originalException = exception;
    captureContext.hint.syntheticException = syntheticException as Error;
  }

  return getCurrentClient()?.captureException(exception, captureContext);
}

export function captureMessage(message: string, captureContext: CaptureContext = {}): string | undefined {
  try {
    throw new Error(message);
  } catch (syntheticException) {
    captureContext.hint = captureContext.hint ?? {};
    captureContext.hint.syntheticException = syntheticException as Error;
  }

  return getCurrentClient()?.captureMessage(message, captureContext);
}

export function captureEvent(event: SentryEvent, captureContext: CaptureContext = {}): string | undefined {
  return getCurrentClient()?.captureEvent(event, captureContext);
}

// TODO: Add `captureEnvelope` and use it for sessions/events/transactions?

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
