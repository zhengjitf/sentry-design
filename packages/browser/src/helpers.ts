import { Dsn, getReportDialogEndpoint, ReportDialogOptions } from '@sentry/transport-base';
import { logger } from '@sentry/utils';

let ignoreOnError: number = 0;

/**
 * @hidden
 */
export function shouldIgnoreOnError(): boolean {
  return ignoreOnError > 0;
}

/**
 * @hidden
 */
export function ignoreNextOnError(): void {
  // onerror should trigger before setTimeout
  ignoreOnError += 1;
  setTimeout(() => {
    ignoreOnError -= 1;
  });
}

// TODO: Move it from helpers and remove helpers completely
export function injectReportDialog(options: ReportDialogOptions & { onLoad?(): void } = {}): void {
  if (!options.eventId) {
    logger.error(`Missing eventId option in showReportDialog call`);
    return;
  }
  if (!options.dsn) {
    logger.error(`Missing dsn option in showReportDialog call`);
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = getReportDialogEndpoint(new Dsn(options.dsn));

  if (options.onLoad) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    script.onload = options.onLoad;
  }

  (document.head || document.body).appendChild(script);
}
