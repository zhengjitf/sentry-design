export {
  Breadcrumb,
  BreadcrumbHint,
  Request,
  SdkInfo,
  Event,
  EventHint,
  Exception,
  Response,
  Severity,
  StackFrame,
  Stacktrace,
  Status,
  Thread,
  User,
} from '@sentry/types';

export {
  addGlobalEventProcessor,
  addBreadcrumb,
  captureException,
  captureEvent,
  captureMessage,
  configureScope,
  getHubFromCarrier,
  getCurrentHub,
  Hub,
  makeMain,
  Scope,
  startTransaction,
  SDK_VERSION,
  setContext,
  setExtra,
  setExtras,
  setTag,
  setTags,
  setUser,
  withScope,
} from '@sentry/core';

export { NodeClient, NodeOptions } from './client';
export { defaultIntegrations, init, lastEventId, flush, close } from './sdk';
export { SDK_NAME } from './version';

import * as Handlers from './handlers';
import * as NodeIntegrations from './integrations';

const INTEGRATIONS = {
  ...NodeIntegrations,
};

export { INTEGRATIONS as Integrations, Handlers };
