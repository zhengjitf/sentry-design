import { ScopeLike } from '@sentry/types';

import { getCurrentClient } from './carrier';

export { getCarrier, getCurrentClient, getCurrentScope } from './carrier';
export { captureException, captureMessage, captureEvent, close, flush, lastEventId } from './client';
export {
  addBreadcrumb,
  getSpan,
  getTransaction,
  setContext,
  setExtra,
  setExtras,
  setSpan,
  setTag,
  setTags,
  setUser,
} from './scope';

export function configureScope(callback: (scope: ScopeLike) => void): void {
  const client = getCurrentClient();
  if (client) {
    callback(client.getScope());
  }
}

export function withScope(callback: (scope: ScopeLike) => void): void {
  const client = getCurrentClient();

  if (client) {
    const currentScope = client.getScope();
    const newScope = currentScope.clone();
    try {
      client.setScope(newScope);
      callback(newScope);
    } catch (_oO) {
      // no-empty
    }
    client.setScope(currentScope);
  }
}
