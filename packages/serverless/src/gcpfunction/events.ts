import { getCurrentClient } from '@sentry/minimal';
import { captureException, flush } from '@sentry/node';
import { startTransaction } from '@sentry/tracing';
import { logger } from '@sentry/utils';

import { domainify, getActiveDomain, proxyFunction } from '../utils';

import { configureScopeWithContext, EventFunction, EventFunctionWithCallback, WrapperOptions } from './general';

export type EventFunctionWrapperOptions = WrapperOptions;

/**
 * Wraps an event function handler adding it error capture and tracing capabilities.
 *
 * @param fn SentryEvent handler
 * @param options Options
 * @returns SentryEvent handler
 */
export function wrapEventFunction(
  fn: EventFunction | EventFunctionWithCallback,
  wrapOptions: Partial<EventFunctionWrapperOptions> = {},
): EventFunctionWithCallback {
  return proxyFunction(fn, f => domainify(_wrapEventFunction(f, wrapOptions)));
}

/** */
function _wrapEventFunction(
  fn: EventFunction | EventFunctionWithCallback,
  wrapOptions: Partial<EventFunctionWrapperOptions> = {},
): EventFunctionWithCallback {
  const options: EventFunctionWrapperOptions = {
    flushTimeout: 2000,
    ...wrapOptions,
  };
  return (data, context, callback) => {
    const transaction = startTransaction({
      name: context.eventType,
      op: 'gcp.function.event',
    });

    // getScope() is expected to use current active domain as a carrier
    // since functions-framework creates a domain for each incoming request.
    // So adding of event processors every time should not lead to memory bloat.
    const scope = getCurrentClient()?.getScope();
    if (scope) {
      configureScopeWithContext(scope, context);
      // We put the transaction on the scope so users can attach children to it
      scope.setSpan(transaction);
    }

    const activeDomain = getActiveDomain()!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

    activeDomain.on('error', captureException);

    const newCallback = activeDomain.bind((...args: unknown[]) => {
      if (args[0] !== null && args[0] !== undefined) {
        captureException(args[0]);
      }
      transaction.finish();

      flush(options.flushTimeout)
        .then(() => {
          callback(...args);
        })
        .then(null, e => {
          logger.error(e);
        });
    });

    if (fn.length > 2) {
      return (fn as EventFunctionWithCallback)(data, context, newCallback);
    }

    Promise.resolve()
      .then(() => (fn as EventFunction)(data, context))
      .then(
        result => {
          newCallback(null, result);
        },
        err => {
          newCallback(err, undefined);
        },
      );
  };
}
