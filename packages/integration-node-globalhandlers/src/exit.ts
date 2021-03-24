import { ClientLike } from '@sentry/types';
import { logger } from '@sentry/utils';

const DEFAULT_SHUTDOWN_TIMEOUT = 2000;

/**
 * @hidden
 */
export function logAndExitProcess(client: ClientLike): (error: { stack?: string }) => void {
  return (error: { stack?: string }): void => {
    // eslint-disable-next-line no-console
    console.error(error && error.stack ? error.stack : error);

    const timeout = client.options.shutdownTimeout ?? DEFAULT_SHUTDOWN_TIMEOUT;
    client
      .close(timeout)
      .then((result: boolean) => {
        if (!result) {
          logger.warn('We reached the timeout for emptying the request buffer, still exiting now!');
        }
        global.process.exit(1);
      })
      .then(null, e => {
        // eslint-disable-next-line no-console
        console.error(e);
      });
  };
}
