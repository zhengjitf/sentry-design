import { getTransaction } from '@sentry/scope';
import { addInstrumentationHandler, logger } from '@sentry/utils';

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
  const activeTransaction = getTransaction();
  if (activeTransaction) {
    logger.log(`[Tracing] Transaction: ${SpanStatus.InternalError} -> Global error occured`);
    activeTransaction.setStatus(SpanStatus.InternalError);
  }
}
