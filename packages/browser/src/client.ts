import { BaseClient, SDK_VERSION } from '@sentry/core';
import { Event, EventHint, Options, ScopeLike, Severity } from '@sentry/types';
import { getGlobalObject, logger, supportsFetch } from '@sentry/utils';
import { ReportDialogOptions } from '@sentry/transport-base';
import { FetchTransport } from '@sentry/transport-fetch';
import { XHRTransport } from '@sentry/transport-xhr';
import { getCarrier } from '@sentry/minimal';

import { injectReportDialog } from './helpers';
import { eventFromException, eventFromMessage } from './eventbuilder';

/**
 * Configuration options for the Sentry Browser SDK.
 * @see BrowserClient for more information.
 */
export interface BrowserOptions extends Options {
  /**
   * A pattern for error URLs which should exclusively be sent to Sentry.
   * This is the opposite of {@link Options.denyUrls}.
   * By default, all errors will be sent.
   */
  allowUrls?: Array<string | RegExp>;

  /**
   * A pattern for error URLs which should not be sent to Sentry.
   * To allow certain errors instead, use {@link Options.allowUrls}.
   * By default, all errors will be sent.
   */
  denyUrls?: Array<string | RegExp>;

  /**
   * A flag enabling Sessions Tracking feature.
   * By default Sessions Tracking is disabled.
   */
  autoSessionTracking?: boolean;
}

/**
 * The Sentry Browser SDK Client.
 *
 * @see BrowserOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export class BrowserClient extends BaseClient<BrowserOptions> {
  /**
   * Creates a new Browser SDK instance.
   *
   * @param options Configuration options for this SDK.
   */
  public constructor(options: BrowserOptions = {}) {
    options._metadata = options._metadata || {};
    options._metadata.sdk = options._metadata.sdk || {
      name: 'sentry.javascript.browser',
      packages: [
        {
          name: 'npm:@sentry/browser',
          version: SDK_VERSION,
        },
      ],
      version: SDK_VERSION,
    };
    options.transport = options.transport ?? (supportsFetch() ? FetchTransport : XHRTransport);

    super(options);
  }

  public getScope(): ScopeLike | undefined {
    return this._scope || getCarrier().scope;
  }

  /**
   * Show a report dialog to the user to send feedback to a specific event.
   *
   * @param options Set individual options for the dialog
   */
  public showReportDialog(options: ReportDialogOptions = {}): void {
    // doesn't work without a document (React Native)
    const document = getGlobalObject<Window>().document;
    if (!document) {
      return;
    }

    if (!this._isEnabled()) {
      logger.error('Trying to call showReportDialog with Sentry Client disabled');
      return;
    }

    injectReportDialog({
      ...options,
      dsn: options.dsn || this.getDsn()?.toString(),
    });
  }

  /**
   * @inheritDoc
   */
  protected _eventFromException(exception: unknown, hint?: EventHint): PromiseLike<Event> {
    return eventFromException(this.options, exception, hint);
  }
  /**
   * @inheritDoc
   */
  protected _eventFromMessage(message: string, level: Severity = Severity.Info, hint?: EventHint): PromiseLike<Event> {
    return eventFromMessage(this.options, message, level, hint);
  }

  // TODO: Restore this functionality somewhere else, it definitely shouldn't be here.
  // protected _sendEvent(event: Event): void {
  //   const integration = this.getIntegration(Breadcrumbs);
  //   if (integration) {
  //     integration.addSentryBreadcrumb(event);
  //   }
  //   super._sendEvent(event);
  // }
}
