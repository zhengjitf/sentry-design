export {
  addGlobalEventProcessor,
  addBreadcrumb,
  Scope,
  setContext,
  setExtra,
  setExtras,
  setTag,
  setTags,
  setUser,
} from '@sentry/scope';
export { getHubFromCarrier, getCurrentHub, Hub, makeMain } from '@sentry/hub';
export { configureScope, startTransaction, withScope } from '@sentry/minimal';
export { captureException, captureEvent, captureMessage, close, flush, lastEventId, SDK_VERSION } from '@sentry/core';

export { NodeClient, NodeOptions } from './client';
export { defaultIntegrations, init } from './sdk';
export { SDK_NAME } from './version';

// TODO: Can be written as `export * as Handlers from './handlers'` but ESLint doesnt understand it for some reason. Investigate.
import * as Handlers from './handlers';
import * as Integrations from './integrations';

export { Handlers, Integrations };
