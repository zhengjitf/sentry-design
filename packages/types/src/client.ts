import { Dsn } from './dsn';
import { CaptureContext, SentryEvent } from './event';
import { EventProcessor } from './eventprocessor';
import { Options } from './options';
import { ScopeLike } from './scope';
import { Session } from './session';

/**
 * User-Facing Sentry SDK Client.
 *
 * This interface contains all methods to interface with the SDK once it has
 * been installed. It allows to send events to Sentry, record breadcrumbs and
 * set a context included in every event. Since the SDK mutates its environment,
 * there will only be one instance during runtime.
 *
 */
export interface ClientLike<O extends Options = Options> {
  options: O;
  logger: Logger;
  dsn?: Dsn;

  getScope(): ScopeLike;
  setScope(scope: ScopeLike): void;
  addEventProcessor(callback: EventProcessor): void;
  lastEventId(): string | undefined;

  captureException(exception: unknown, captureContext?: CaptureContext): string | undefined;
  captureMessage(message: string, captureContext?: CaptureContext): string | undefined;
  captureEvent(event: SentryEvent, captureContext?: CaptureContext): string | undefined;
  captureSession(session: Session): void;

  flush(timeout?: number): PromiseLike<boolean>;
  close(timeout?: number): PromiseLike<boolean>;
}

interface Logger {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}
