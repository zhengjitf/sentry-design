import * as domain from 'domain';

import { BaseClient, SDK_VERSION } from '@sentry/core';
import { Event, EventHint, Options, ScopeLike, Severity } from '@sentry/types';
import { HTTPTransport } from '@sentry/transport-http';
import { getCarrier } from '@sentry/minimal';

import { eventFromException, eventFromMessage } from './eventbuilder';

/**
 * Configuration options for the Sentry Node SDK.
 * @see NodeClient for more information.
 */
export interface NodeOptions extends Options {
  /** Sets an optional server name (device name) */
  serverName?: string;

  /** Maximum time in milliseconds to wait to drain the request queue, before the process is allowed to exit. */
  shutdownTimeout?: number;

  /** Set a HTTP proxy that should be used for outbound requests. */
  httpProxy?: string;

  /** Set a HTTPS proxy that should be used for outbound requests. */
  httpsProxy?: string;

  /** HTTPS proxy certificates path */
  caCerts?: string;

  /** Sets the number of context lines for each frame when loading a file. */
  frameContextLines?: number;

  /** Callback that is executed when a fatal global error occurs. */
  onFatalError?(error: Error): void;
}

/**
 * The Sentry Node SDK Client.
 *
 * @see NodeOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export class NodeClient extends BaseClient<NodeOptions> {
  /**
   * Creates a new Node SDK instance.
   * @param options Configuration options for this SDK.
   */
  public constructor(options: NodeOptions) {
    options._metadata = options._metadata || {};
    options._metadata.sdk = options._metadata.sdk || {
      name: 'sentry.javascript.node',
      packages: [
        {
          name: 'npm:@sentry/node',
          version: SDK_VERSION,
        },
      ],
      version: SDK_VERSION,
    };
    options.transport = options.transport ?? HTTPTransport;

    super(options);
  }

  public getScope(): ScopeLike | undefined {
    if (this._scope) {
      return this._scope;
    }

    const activeDomain = ((domain as unknown) as { active: unknown }).active;
    if (activeDomain) {
      const domainScope = getCarrier(activeDomain).scope;
      if (domainScope) {
        return domainScope;
      }
    }

    return getCarrier().scope;
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  protected _eventFromException(exception: any, hint?: EventHint): PromiseLike<Event> {
    return eventFromException(this.options, exception, hint);
  }

  /**
   * @inheritDoc
   */
  protected _eventFromMessage(message: string, level: Severity = Severity.Info, hint?: EventHint): PromiseLike<Event> {
    return eventFromMessage(this.options, message, level, hint);
  }
}
