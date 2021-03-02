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

export { BrowserClient, BrowserOptions } from './client';
export { defaultIntegrations, forceLoad, init, onLoad, showReportDialog, wrap } from './sdk';
export { SDK_NAME } from './version';
