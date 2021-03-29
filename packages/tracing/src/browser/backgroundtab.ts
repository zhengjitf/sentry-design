import { ClientLike } from '@sentry/types';
import { getGlobalObject } from '@sentry/utils';

import { IdleTransaction } from '../idletransaction';
import { SpanStatus } from '../spanstatus';

const global = getGlobalObject<Window>();

/**
 * Add a listener that cancels and finishes a transaction when the global
 * document is hidden.
 */
export function registerBackgroundTabDetection(client: ClientLike): void {
  if (global && global.document) {
    global.document.addEventListener('visibilitychange', () => {
      const activeTransaction = client.getScope().getTransaction() as IdleTransaction;
      if (global.document.hidden && activeTransaction) {
        client.logger.log(
          `[Tracing] Transaction: ${SpanStatus.Cancelled} -> since tab moved to the background, op: ${activeTransaction.op}`,
        );
        // We should not set status if it is already set, this prevent important statuses like
        // error or data loss from being overwritten on transaction.
        if (!activeTransaction.status) {
          activeTransaction.setStatus(SpanStatus.Cancelled);
        }
        activeTransaction.setTag('visibilitychange', 'document.hidden');
        activeTransaction.finish();
      }
    });
  } else {
    client.logger.warn('[Tracing] Could not set up background tab detection due to lack of global document');
  }
}
