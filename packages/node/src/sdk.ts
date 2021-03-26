import * as domain from 'domain';

import { getCarrier } from '@sentry/minimal';
import { InboundFilters } from '@sentry/integration-common-inboundfilters';
import { LinkedErrors } from '@sentry/integration-node-linkederrors';
import { ContextLines } from '@sentry/integration-node-contextlines';
import { OnUncaughtException, OnUnhandledRejection } from '@sentry/integration-node-globalhandlers';
import { ConsoleBreadcrumbs, HTTPBreadcrumbs } from '@sentry/integration-node-breadcrumbs';
import { HTTPTransport } from '@sentry/transport-http';
import { ClientLike, Integration } from '@sentry/types';

import { NodeClient, NodeOptions } from './client';

export function init(options: NodeOptions = {}): ClientLike {
  // TODO: Reevaluate whether stickin it on the domain is still necessary
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const carrier = (domain as any).active ? getCarrier((domain as any).active) : getCarrier();
  const client = initClient(options);
  carrier.client = client;
  return client;
}

export function initClient(options: NodeOptions = {}): ClientLike {
  options.dsn = options.dsn ?? process.env.SENTRY_DSN;
  options.release = options.release ?? process.env.SENTRY_RELEASE;
  options.environment = options.environment ?? process.env.SENTRY_ENVIRONMENT;

  if (options.tracesSampleRate === undefined && process.env.SENTRY_TRACES_SAMPLE_RATE) {
    const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE);
    if (isFinite(tracesSampleRate)) {
      options.tracesSampleRate = tracesSampleRate;
    }
  }

  options.transport = options.transport ?? HTTPTransport;

  options._internal = options._internal || {};
  options._internal.defaultIntegrations = options.defaultIntegrations
    ? options._internal.defaultIntegrations || getDefaultIntegrations()
    : [];
  options._internal.discoveredIntegrations = options.discoverIntegrations ? discoverIntegrations() : [];

  return new NodeClient(options);
}

export const getDefaultIntegrations = (): Integration[] => [
  new ConsoleBreadcrumbs(),
  new HTTPBreadcrumbs(),
  new LinkedErrors(),
  new ContextLines(),
  new InboundFilters(),
  new OnUncaughtException(),
  new OnUnhandledRejection(),
];

function discoverIntegrations(): Integration[] {
  return [];
}
