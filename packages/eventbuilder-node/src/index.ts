// TODO: All these functions are confusing af. They _have_ to be unified and become more descriptive in one way or another.

import { CaptureContext, SentryEvent, Mechanism, Options, Severity } from '@sentry/types';
import {
  addExceptionMechanism,
  addExceptionTypeValue,
  extractExceptionKeysForMessage,
  isError,
  isPlainObject,
  normalizeToSize,
} from '@sentry/utils';

import { extractStackFromError, parseError, parseStack, prepareFramesForEvent } from './parsers';
export { getExceptionFromError } from './parsers';

export function eventFromException(
  options: Options & { serverName?: string },
  exception: unknown,
  captureContext: CaptureContext,
): SentryEvent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ex: any = exception;
  const mechanism: Mechanism = {
    handled: true,
    type: 'generic',
  };
  let shouldSerializeException = false;

  if (!isError(exception)) {
    if (isPlainObject(exception)) {
      // This will allow us to group events based on top-level keys
      // which is much better than creating new group when any key/value change
      const message = `Non-Error exception captured with keys: ${extractExceptionKeysForMessage(exception)}`;
      shouldSerializeException = true;
      ex = captureContext.hint?.syntheticException || new Error(message);
      (ex as Error).message = message;
    } else {
      // This handles when someone does: `throw "something awesome";`
      // We use synthesized Error here so we can extract a (rough) stack trace.
      ex = captureContext.hint?.syntheticException || new Error(exception as string);
      (ex as Error).message = exception as string;
    }
    mechanism.synthetic = true;
  }

  const event = parseError(ex as Error);
  addExceptionTypeValue(event, undefined, undefined);
  addExceptionMechanism(event, mechanism);
  if (captureContext.hint?.event_id) {
    event.event_id = captureContext.hint?.event_id;
  }
  event.platform = 'node';
  if (options.serverName) {
    event.server_name = options.serverName;
  }
  if (shouldSerializeException) {
    event.extra = event.extra || {};
    event.extra.__serialized__ = normalizeToSize(exception as Record<string, unknown>);
  }
  return event;
}

export function eventFromMessage(options: Options, message: string, captureContext: CaptureContext): SentryEvent {
  const event: SentryEvent = {
    level: captureContext.scope?.level || Severity.Info,
    message,
    platform: 'node',
  };

  if (captureContext.hint?.event_id) {
    event.event_id = captureContext.hint?.event_id;
  }

  if (options.attachStacktrace && captureContext.hint?.syntheticException) {
    const stack = extractStackFromError(captureContext.hint?.syntheticException);
    const frames = parseStack(stack);
    event.stacktrace = {
      frames: prepareFramesForEvent(frames),
    };
    return event;
  } else {
    return event;
  }
}
