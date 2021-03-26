export { Scope } from '@sentry/scope';
export {
  addBreadcrumb,
  configureScope,
  withScope,
  setContext,
  setExtra,
  setExtras,
  setTag,
  setTags,
  setUser,
  captureException,
  captureEvent,
  captureMessage,
  close,
  flush,
  lastEventId,
} from '@sentry/minimal';
export { SDK_VERSION } from '@sentry/core';

export { NodeClient, NodeOptions } from './client';
export { getDefaultIntegrations, init, initClient } from './sdk';

// TODO: Can be written as `export * as Handlers from './handlers'` but ESLint doesnt understand it for some reason. Investigate.
import * as Handlers from './handlers';

// TODO: Expose all integrations through `Sentry.Integrations` again?
const Integrations = {};
// import * as Integrations from './integrations';

export { Handlers, Integrations };
