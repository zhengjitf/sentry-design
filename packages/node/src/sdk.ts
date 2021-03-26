import * as domain from 'domain';

import { getCarrier } from '@sentry/minimal';
import { InboundFilters } from '@sentry/integration-common-inboundfilters';
import { LinkedErrors } from '@sentry/integration-node-linkederrors';
import { ContextLines } from '@sentry/integration-node-contextlines';
import { OnUncaughtException, OnUnhandledRejection } from '@sentry/integration-node-globalhandlers';
import { ConsoleBreadcrumbs, HTTPBreadcrumbs } from '@sentry/integration-node-breadcrumbs';
import { HTTPTransport } from '@sentry/transport-http';
import { ClientLike, Integration } from '@sentry/types';
import { sync as readPkgUp } from 'read-pkg-up';

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
  const opts: NodeOptions = {
    dsn: process.env.SENTRY_DSN,
    release: process.env.SENTRY_RELEASE,
    environment: process.env.SENTRY_ENVIRONMENT,
    transport: HTTPTransport,
    defaultIntegrations: true,
    discoverIntegrations: true,
    ...options,
    _internal: {
      defaultIntegrations:
        options.defaultIntegrations === false ? [] : options._internal?.defaultIntegrations || getDefaultIntegrations(),
      discoveredIntegrations:
        options.discoverIntegrations === false
          ? []
          : options._internal?.discoveredIntegrations || discoverIntegrations(),
      ...options._internal,
    },
  };

  if (!('tracesSampleRate' in opts) && process.env.SENTRY_TRACES_SAMPLE_RATE) {
    const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE);
    if (isFinite(tracesSampleRate)) {
      opts.tracesSampleRate = tracesSampleRate;
    }
  }

  return new NodeClient(opts);
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
  const pkg = readPkgUp();

  if (!pkg) {
    return [];
  }

  return Object.keys({
    ...pkg.packageJson.dependencies,
    ...pkg.packageJson.devDependencies,
  })
    .filter(name => {
      return /^@sentry\/integration-(common|node)-[a-z]/.test(name);
    })
    .map(name => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(name);
      return Object.values(mod) as { new (): Integration }[];
    })
    .reduce((acc, integrations) => {
      return acc.concat(integrations.map(Integration => new Integration()));
    }, [] as Integration[]);
}
