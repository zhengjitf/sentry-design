import { ClientLike, Integration } from '@sentry/types';
import { captureException, getCarrier, getCurrentClient } from '@sentry/minimal';
import { addInstrumentationHandler, getGlobalObject, logger, supportsFetch } from '@sentry/utils';
import { Dsn, getReportDialogEndpoint, ReportDialogOptions } from '@sentry/transport-base';
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
import { FetchTransport } from '@sentry/transport-fetch';
import { XHRTransport } from '@sentry/transport-xhr';

import { BrowserClient, BrowserOptions } from './client';

export function init(options: BrowserOptions = {}): ClientLike {
  const carrier = getCarrier();
  const client = initClient(options);
  carrier.client = client;
  if (options.autoSessionTracking) {
    startSessionTracking(client);
  }
  return client;
}

export function initClient(options: BrowserOptions = {}): ClientLike {
  // Injected by sentry-webpack-plugin
  options.release = options.release ?? getGlobalObject<Window>().SENTRY_RELEASE?.id;
  options.autoSessionTracking = options.autoSessionTracking ?? true;
  options.transport = options.transport ?? (supportsFetch() ? FetchTransport : XHRTransport);

  options._internal = options._internal || {};
  options._internal.defaultIntegrations = options.defaultIntegrations
    ? options._internal.defaultIntegrations || getDefaultIntegrations()
    : [];
  options._internal.discoveredIntegrations = options.discoverIntegrations ? discoverIntegrations() : [];

  return new BrowserClient(options);
}

export const getDefaultIntegrations = (): Integration[] => [
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

function discoverIntegrations(): Integration[] {
  return [];
}

/**
 * Present the user with a report dialog.
 *
 * @param options Everything is optional, we try to fetch all info need from the global scope.
 */
export function showReportDialog(
  options: ReportDialogOptions & { onLoad?(): void } = {},
  customClient?: ClientLike,
): void {
  const errPrefix = `Trying to call showReportDialog with`;

  // doesn't work without a document (React Native)
  const global = getGlobalObject<Window>();
  if (!global.document) {
    return;
  }

  const client = customClient ?? getCurrentClient();
  if (!client) {
    return;
  }

  options.eventId = options.eventId ?? client.lastEventId();
  options.dsn = options.dsn ?? client.options.dsn;

  if (client.options.enabled === false) {
    logger.error(`${errPrefix} disabled client`);
    return;
  }

  if (!options.eventId) {
    logger.error(`${errPrefix} missing EventID`);
    return;
  }

  if (!options.dsn) {
    logger.error(`${errPrefix} missing DSN`);
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = getReportDialogEndpoint(new Dsn(options.dsn));

  if (options.onLoad) {
    script.onload = options.onLoad; // eslint-disable-line @typescript-eslint/unbound-method
  }

  (global.document.head || global.document.body).appendChild(script);
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
function startSessionTracking(_client: ClientLike): void {
  const window = getGlobalObject<Window>();
  const document = window.document;

  if (typeof document === 'undefined') {
    logger.warn('Session tracking in non-browser environment with @sentry/browser is not supported.');
    return;
  }

  // TODO: Move startSesssion/captureSession to `@sentry/session` and use it correctly here
  const startSession = (): boolean => true;
  const captureSession = (): boolean => true;

  startSession();
  captureSession();

  // We want to create a session for every navigation as well
  addInstrumentationHandler({
    callback: () => {
      startSession();
      captureSession();
    },
    type: 'history',
  });
}
