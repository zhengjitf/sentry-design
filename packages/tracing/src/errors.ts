import { getCurrentClient } from '@sentry/minimal';
import { addInstrumentationHandler } from '@sentry/utils';

import { SpanStatus } from './spanstatus';

/**
 * Configures global error listeners
 */
export function registerErrorInstrumentation(): void {
  addInstrumentationHandler({
    callback: errorCallback,
    type: 'error',
  });
  addInstrumentationHandler({
    callback: errorCallback,
    type: 'unhandledrejection',
  });
}

/**
 * If an error or unhandled promise occurs, we mark the active transaction as failed
 */
function errorCallback(): void {
  const client = getCurrentClient();
  const activeTransaction = client?.getScope().getTransaction();
  if (activeTransaction) {
    client?.logger.log(`[Tracing] Transaction: ${SpanStatus.InternalError} -> Global error occured`);
    activeTransaction.setStatus(SpanStatus.InternalError);
  }
}
