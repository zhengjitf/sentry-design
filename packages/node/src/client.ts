import { BaseClient, getCurrentHub, Scope, SDK_VERSION } from '@sentry/core';
import { Event, EventHint, Mechanism, Options, Severity } from '@sentry/types';
import {
  addExceptionMechanism,
  addExceptionTypeValue,
  extractExceptionKeysForMessage,
  isError,
  isPlainObject,
  normalizeToSize,
  SyncPromise,
} from '@sentry/utils';
import { NoopTransport, Transport, TransportOptions } from '@sentry/transport-base';
import { HTTPTransport } from '@sentry/transport-http';

import { extractStackFromError, parseError, parseStack, prepareFramesForEvent } from './parsers';

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

    super(options);
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public eventFromException(exception: any, hint?: EventHint): PromiseLike<Event> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ex: any = exception;
    const mechanism: Mechanism = {
      handled: true,
      type: 'generic',
    };

    if (!isError(exception)) {
      if (isPlainObject(exception)) {
        // This will allow us to group events based on top-level keys
        // which is much better than creating new group when any key/value change
        const message = `Non-Error exception captured with keys: ${extractExceptionKeysForMessage(exception)}`;

        getCurrentHub().configureScope(scope => {
          scope.setExtra('__serialized__', normalizeToSize(exception as Record<string, unknown>));
        });

        ex = (hint && hint.syntheticException) || new Error(message);
        (ex as Error).message = message;
      } else {
        // This handles when someone does: `throw "something awesome";`
        // We use synthesized Error here so we can extract a (rough) stack trace.
        ex = (hint && hint.syntheticException) || new Error(exception as string);
        (ex as Error).message = exception;
      }
      mechanism.synthetic = true;
    }

    return new SyncPromise<Event>((resolve, reject) =>
      parseError(ex as Error, this._options)
        .then(event => {
          addExceptionTypeValue(event, undefined, undefined);
          addExceptionMechanism(event, mechanism);

          resolve({
            ...event,
            event_id: hint && hint.event_id,
          });
        })
        .then(null, reject),
    );
  }

  /**
   * @inheritDoc
   */
  public eventFromMessage(message: string, level: Severity = Severity.Info, hint?: EventHint): PromiseLike<Event> {
    const event: Event = {
      event_id: hint && hint.event_id,
      level,
      message,
    };

    return new SyncPromise<Event>(resolve => {
      if (this._options.attachStacktrace && hint && hint.syntheticException) {
        const stack = hint.syntheticException ? extractStackFromError(hint.syntheticException) : [];
        parseStack(stack, this._options)
          .then(frames => {
            event.stacktrace = {
              frames: prepareFramesForEvent(frames),
            };
            resolve(event);
          })
          .then(null, () => {
            resolve(event);
          });
      } else {
        resolve(event);
      }
    });
  }

  /**
   * @inheritDoc
   */
  protected _prepareEvent(event: Event, scope?: Scope, hint?: EventHint): PromiseLike<Event | null> {
    event.platform = event.platform || 'node';
    if (this.getOptions().serverName) {
      event.server_name = this.getOptions().serverName;
    }
    return super._prepareEvent(event, scope, hint);
  }

  /**
   * @inheritDoc
   */
  protected _setupTransport(): Transport {
    // TODO: This whole function should be unnecessary and moved to client construction
    if (!this._options.dsn) {
      // We return the noop transport here in case there is no Dsn.
      return new NoopTransport();
    }

    const transportOptions: TransportOptions = {
      ...this._options.transportOptions,
      ...(this._options.httpProxy && { httpProxy: this._options.httpProxy }),
      ...(this._options.httpsProxy && { httpsProxy: this._options.httpsProxy }),
      ...(this._options.caCerts && { caCerts: this._options.caCerts }),
      dsn: this._options.transportOptions?.dsn ?? this._options.dsn,
    };

    if (this._options.transport) {
      return new this._options.transport(transportOptions);
    }

    return new HTTPTransport(transportOptions);
  }
}
