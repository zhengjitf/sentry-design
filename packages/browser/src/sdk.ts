import { ClientLike } from '@sentry/types';
import { captureException, getCurrentClient } from '@sentry/minimal';
import { initAndBind } from '@sentry/core';
import { getCurrentHub } from '@sentry/hub';
import { addInstrumentationHandler, getGlobalObject, logger } from '@sentry/utils';
import { ReportDialogOptions } from '@sentry/transport-base';
import { InboundFilters } from '@sentry/integration-common-inboundfilters';
import { UserAgent } from '@sentry/integration-browser-useragent';
import { EventTargetWrap, TimersWrap, XHRWrap } from '@sentry/integration-browser-wrap';
import {
  ConsoleBreadcrumbs,
  DOMBreadcrumbs,
  XHRBreadcrumbs,
  FetchBreadcrumbs,
  HistoryBreadcrumbs,
} from '@sentry/integration-browser-breadcrumbs';
import { LinkedErrors } from '@sentry/integration-browser-linkederrors';
import { OnError, OnUnhandledRejection } from '@sentry/integration-browser-globalhandlers';

import { BrowserClient, BrowserOptions } from './client';
import { injectReportDialog } from './helpers';

export const defaultIntegrations = [];

/**
 * The Sentry Browser SDK Client.
 *
 * To use this SDK, call the {@link init} function as early as possible when
 * loading the web page. To set context information or send manual events, use
 * the provided methods.
 *
 * @example
 *
 * ```
 *
 * import { init } from '@sentry/browser';
 *
 * init({
 *   dsn: '__DSN__',
 *   // ...
 * });
 * ```
 *
 * @example
 * ```
 *
 * import { configureScope } from '@sentry/browser';
 * configureScope((scope: Scope) => {
 *   scope.setExtra({ battery: 0.7 });
 *   scope.setTag({ user_mode: 'admin' });
 *   scope.setUser({ id: '4711' });
 * });
 * ```
 *
 * @example
 * ```
 *
 * import { addBreadcrumb } from '@sentry/browser';
 * addBreadcrumb({
 *   message: 'My Breadcrumb',
 *   // ...
 * });
 * ```
 *
 * @example
 *
 * ```
 *
 * import * as Sentry from '@sentry/browser';
 * Sentry.captureMessage('Hello, world!');
 * Sentry.captureException(new Error('Good bye'));
 * Sentry.captureEvent({
 *   message: 'Manual',
 *   stacktrace: [
 *     // ...
 *   ],
 * });
 * ```
 *
 * @see {@link BrowserOptions} for documentation on configuration options.
 */
export function init(options: BrowserOptions = {}): void {
  // TODO: Remove and rename to regular integrations. Used only to make sure new integrations compile.
  options.fancyIntegrations = [
    new EventTargetWrap(),
    new TimersWrap(),
    new XHRWrap(),
    new ConsoleBreadcrumbs(),
    new DOMBreadcrumbs(),
    new XHRBreadcrumbs(),
    new FetchBreadcrumbs(),
    new HistoryBreadcrumbs(),
    new InboundFilters(),
    new UserAgent(),
    new LinkedErrors(),
    new OnError(),
    new OnUnhandledRejection(),
  ];

  if (options.defaultIntegrations === undefined) {
    options.defaultIntegrations = defaultIntegrations;
  }
  if (options.release === undefined) {
    const window = getGlobalObject<Window>();
    // This supports the variable that sentry-webpack-plugin injects
    if (window.SENTRY_RELEASE && window.SENTRY_RELEASE.id) {
      options.release = window.SENTRY_RELEASE.id;
    }
  }
  if (options.autoSessionTracking === undefined) {
    options.autoSessionTracking = true;
  }

  initAndBind(BrowserClient, options);

  if (options.autoSessionTracking) {
    startSessionTracking();
  }
}

/**
 * Present the user with a report dialog.
 *
 * @param options Everything is optional, we try to fetch all info need from the global scope.
 */
export function showReportDialog(options: ReportDialogOptions = {}, client?: ClientLike): void {
  // doesn't work without a document (React Native)
  const document = getGlobalObject<Window>().document;
  if (!document) {
    return;
  }

  const usableClient = client ?? getCurrentClient();
  if (!usableClient) {
    return;
  }

  options.eventId = options.eventId ?? usableClient.lastEventId();
  options.dsn = options.dsn ?? usableClient.getDsn()?.toString();

  // TODO: Should we keep `isEnabled` around?
  // if (!this._isEnabled()) {
  //   logger.error('Trying to call showReportDialog with Sentry Client disabled');
  //   return;
  // }

  injectReportDialog(options);
}

/**
 * This function is here to be API compatible with the loader.
 * @hidden
 */
export function forceLoad(): void {
  // Noop
}

/**
 * This function is here to be API compatible with the loader.
 * @hidden
 */
export function onLoad(callback: () => void): void {
  callback();
}

/**
 * Wrap code within a try/catch block so the SDK is able to capture errors.
 *
 * @param fn A function to wrap.
 *
 * @returns Wrapped function.
 */
export function wrap(fn: (...args: unknown[]) => unknown): unknown {
  return function(this: unknown, ...args: unknown[]): ReturnType<typeof fn> {
    try {
      return fn.apply(this, args);
    } catch (e) {
      captureException(e);
      return;
    }
  };
}

/**
 * Enable automatic Session Tracking for the initial page load.
 */
function startSessionTracking(): void {
  const window = getGlobalObject<Window>();
  const document = window.document;

  if (typeof document === 'undefined') {
    logger.warn('Session tracking in non-browser environment with @sentry/browser is not supported.');
    return;
  }

  const hub = getCurrentHub();

  if ('startSession' in hub) {
    // The only way for this to be false is for there to be a version mismatch between @sentry/browser (>= 6.0.0) and
    // @sentry/hub (< 5.27.0). In the simple case, there won't ever be such a mismatch, because the two packages are
    // pinned at the same version in package.json, but there are edge cases where it's possible'. See
    // https://github.com/getsentry/sentry-javascript/issues/3234 and
    // https://github.com/getsentry/sentry-javascript/issues/3207.

    hub.startSession();
    hub.captureSession();

    // We want to create a session for every navigation as well
    addInstrumentationHandler({
      callback: () => {
        hub.startSession();
        hub.captureSession();
      },
      type: 'history',
    });
  }
}
