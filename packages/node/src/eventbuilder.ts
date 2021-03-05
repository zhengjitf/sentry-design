import { getCurrentHub } from '@sentry/hub';
import { CaptureContext, Event, Mechanism, Severity } from '@sentry/types';
import {
  addExceptionMechanism,
  addExceptionTypeValue,
  extractExceptionKeysForMessage,
  isError,
  isPlainObject,
  normalizeToSize,
  SyncPromise,
} from '@sentry/utils';

import { NodeOptions } from './client';
import { extractStackFromError, parseError, parseStack, prepareFramesForEvent } from './parsers';

export function eventFromException(
  options: NodeOptions,
  exception: unknown,
  captureContext: CaptureContext,
): PromiseLike<Event> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ex: any = exception;
  const mechanism: Mechanism = {
    handled: true,
    type: 'generic',
  };

  if (!isError(exception)) {
    if (isPlainObject(exception)) {
      // This will allow us to group events based on top-level keys
      // which is much better than creating new group when any key/value change
      const message = `Non-Error exception captured with keys: ${extractExceptionKeysForMessage(exception)}`;

      getCurrentHub().configureScope(scope => {
        scope.setExtra('__serialized__', normalizeToSize(exception as Record<string, unknown>));
      });

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

  return new SyncPromise<Event>((resolve, reject) =>
    parseError(ex as Error, options)
      .then(event => {
        addExceptionTypeValue(event, undefined, undefined);
        addExceptionMechanism(event, mechanism);
        if (captureContext.hint?.event_id) {
          event.event_id = captureContext.hint?.event_id;
        }
        event.platform = 'node';
        if (options.serverName) {
          event.server_name = options.serverName;
        }
        resolve(event);
      })
      .then(null, reject),
  );
}

export function eventFromMessage(
  options: NodeOptions,
  message: string,
  captureContext: CaptureContext,
): PromiseLike<Event> {
  const event: Event = {
    level: captureContext.scope?.level ?? Severity.Info,
    message,
    platform: 'node',
  };

  if (captureContext.hint?.event_id) {
    event.event_id = captureContext.hint?.event_id;
  }

  return new SyncPromise<Event>(resolve => {
    if (options.attachStacktrace && captureContext.hint?.syntheticException) {
      const stack = extractStackFromError(captureContext.hint?.syntheticException);
      parseStack(stack, options)
        .then(frames => {
          event.stacktrace = {
            frames: prepareFramesForEvent(frames),
          };
          resolve(event);
        })
        .then(null, () => {
          resolve(event);
        });
    } else {
      resolve(event);
    }
  });
}
