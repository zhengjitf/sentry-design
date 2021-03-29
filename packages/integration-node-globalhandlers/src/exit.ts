import { ClientLike } from '@sentry/types';

export function logAndExitProcess(client: ClientLike): (error: { stack?: string }) => void {
  return (error: { stack?: string }): void => {
    // eslint-disable-next-line no-console
    console.error(error && error.stack ? error.stack : error);

    const timeout = client.options.shutdownTimeout ?? 2000;
    client
      .close(timeout)
      .then((result: boolean) => {
        if (!result) {
          client.logger.warn('We reached the timeout for emptying the request buffer, still exiting now!');
        }
        global.process.exit(1);
      })
      .then(null, e => {
        console.error(e); // eslint-disable-line no-console
      });
  };
}
