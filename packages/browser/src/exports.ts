export { Scope } from '@sentry/scope';
export { getHubFromCarrier, getCurrentHub, Hub, makeMain } from '@sentry/hub';
export { configureScope, startTransaction, withScope } from '@sentry/minimal';
export { SDK_VERSION } from '@sentry/core';
export {
  addBreadcrumb,
  addGlobalEventProcessor,
  captureEvent,
  captureException,
  captureMessage,
  close,
  flush,
  lastEventId,
  setContext,
  setExtra,
  setExtras,
  setTag,
  setTags,
  setUser,
} from '@sentry/minimal';

export { BrowserClient, BrowserOptions } from './client';
export { defaultIntegrations, forceLoad, init, onLoad, showReportDialog, wrap } from './sdk';
export { SDK_NAME } from './version';
