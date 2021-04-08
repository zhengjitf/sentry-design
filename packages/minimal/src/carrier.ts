import { CarrierV7, ClientLike, ScopeLike, SentryGlobal } from '@sentry/types';
import { getGlobalObject, logger } from '@sentry/utils';

export function getCarrier(source: unknown & SentryGlobal = getGlobalObject()): CarrierV7 {
  source.__SENTRY_V7__ = source.__SENTRY_V7__ || {};
  return source.__SENTRY_V7__;
}

export function getCurrentClient(carrier = getCarrier()): ClientLike | undefined {
  if (!carrier.client) {
    logger.warn('No client available on the carrier.');
    return;
  }
  return carrier.client;
}

export function getCurrentScope(carrier = getCarrier()): ScopeLike | undefined {
  if (!carrier.scope) {
    logger.warn('No scope available on the carrier.');
    return;
  }
  return carrier.scope;
}
