/* eslint-disable max-lines */
import { CarrierV7, ClientLike } from '@sentry/types';
import { getGlobalObject, logger } from '@sentry/utils';

import { NoopClient } from './noopclient';

// TODO: It shouldnt live on the client, and we need to get rid of current implementation from Hub
function getMainCarrier(): CarrierV7 {
  const global = getGlobalObject();
  global.__SENTRY_V7__ = global.__SENTRY_V7__ || {};
  return global.__SENTRY_V7__;
}

// TODO: Make it optional and call API through `getCurrentClient()?.method()` (?)
export function getCurrentClient(): ClientLike {
  const carrier = getMainCarrier();
  if (!carrier.client) {
    logger.warn('No client available on the carrier. Creating a NoopClient.');
    carrier.client = new NoopClient();
  }
  return carrier.client;
}
