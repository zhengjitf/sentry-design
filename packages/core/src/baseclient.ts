import { Scope, Session } from '@sentry/scope';
import {
  CaptureContext,
  ClientLike,
  SentryEvent,
  EventProcessor,
  Options,
  ScopeLike,
  SessionStatus,
  Integration,
} from '@sentry/types';
import {
  dateTimestampInSeconds,
  getEventDescription,
  isPlainObject,
  isPrimitive,
  logger,
  normalize,
  truncate,
  uuid4,
} from '@sentry/utils';
import {
  Dsn,
  eventToTransportRequest,
  NoopTransport,
  sessionToTransportRequest,
  TransportRequest,
  Transport,
} from '@sentry/transport-base';

import { collectIntegrations } from './integrations';

/**
 * Base implementation for all JavaScript SDK clients.
 *
 * Call the constructor with the corresponding backend constructor and options
 * specific to the client subclass. To access these options later, use
 * {@link Client.getOptions}. Also, the Backend instance is available via
 * {@link Client.getBackend}.
 *
 * If a Dsn is specified in the options, it will be parsed and stored. Use
 * {@link Client.getDsn} to retrieve the Dsn at any moment. In case the Dsn is
 * invalid, the constructor will throw a {@link SentryException}. Note that
 * without a valid Dsn, the SDK will not send any events to Sentry.
 *
 * Before sending an event via the backend, it is passed through
 * {@link BaseClient._prepareEvent} to add SDK information and scope data
 * (breadcrumbs and context). To add more custom information, override this
 * method and extend the resulting prepared event.
 *
 * To issue automatically created events (e.g. via instrumentation), use
 * {@link Client.captureEvent}. It will prepare the event and pass it through
 * the callback lifecycle. To issue auto-breadcrumbs, use
 * {@link Client.addBreadcrumb}.
 *
 * @example
 * class NodeClient extends BaseClient<NodeBackend, NodeOptions> {
 *   public constructor(options: NodeOptions) {
 *     super(NodeBackend, options);
 *   }
 *
 *   // ...
 * }
 */
// TODO: Allow for passing scope during construction for explicit `this._scope`
export abstract class BaseClient<O extends Options> implements ClientLike<O> {
  /** Options passed to the SDK. */
  public readonly options: O;

  /** The client Dsn, if specified in options. Without this Dsn, the SDK will be disabled. */
  public readonly dsn?: Dsn;

  protected _integrations: Record<string, Integration> = {};

  protected _transport: Transport;

  protected _lastEventId?: string;

  protected _scope: ScopeLike = new Scope();

  protected _eventProcessors: EventProcessor[] = [];

  protected _lastException?: unknown;

  /**
   * Initializes this client instance.
   *
   * @param options Options for the client.
   */
  protected constructor(options: O) {
    this.options = options;

    if (options.dsn) {
      this.dsn = new Dsn(options.dsn);
    }

    this._transport = this._setupTransport();
    this._integrations = this._setupIntegrations();
  }

  public lastEventId(): string | undefined {
    return this._lastEventId;
  }

  public getScope(): ScopeLike {
    return this._scope;
  }

  public setScope(scope: ScopeLike): void {
    this._scope = scope;
  }

  // TODO: Run these during event processing
  public addEventProcessor(callback: EventProcessor): void {
    this._eventProcessors.push(callback);
  }

  /**
   * @inheritDoc
   */
  public captureException(exception: unknown, captureContext: CaptureContext = {}): string | undefined {
    const event = this._eventFromException(exception, captureContext);
    return this.captureEvent(event, captureContext);
  }

  /**
   * @inheritDoc
   */
  public captureMessage(message: string, captureContext: CaptureContext = {}): string | undefined {
    const event = isPrimitive(message)
      ? this._eventFromMessage(String(message), captureContext)
      : this._eventFromException(message, captureContext);
    return this.captureEvent(event, captureContext);
  }

  /**
   * @inheritDoc
   */
  public captureEvent(event: SentryEvent, captureContext: CaptureContext = {}): string | undefined {
    // Drop two consecutive events originating from the same source (eg. browser Wrap integrations)
    if (this._lastException && this._lastException === captureContext.hint?.originalException) {
      delete this._lastException;
      return;
    } else {
      this._lastException = captureContext.hint?.originalException;
    }

    const eventId = this._captureEvent(event, captureContext);
    this._lastEventId = eventId;
    return eventId;
  }

  /**
   * @inheritDoc
   */
  public captureSession(session: Session): void {
    if (!session.release) {
      logger.warn('Discarded session because of missing release');
    } else {
      this._sendSession(session);
      // After sending, we set init false to inidcate it's not the first occurence
      session.update({ init: false });
    }
  }

  /**
   * @inheritDoc
   */
  public flush(timeout: number = 0): PromiseLike<boolean> {
    return this._transport.flush(timeout);
  }

  /**
   * @inheritDoc
   */
  public close(timeout: number = 0): PromiseLike<boolean> {
    return this._transport.flush(timeout).then(result => {
      this.options.enabled = false;
      return result;
    });
  }

  protected _setupTransport(): Transport {
    // TODO: This whole function should be unnecessary and moved to client construction
    if (!this.options.dsn || !this.options.transport) {
      return new NoopTransport();
    }

    return new this.options.transport({
      dsn: this.options.dsn,
      ...this.options.transportOptions,
      // TODO: Deprecate these options and move to `transportOptions`
      // ...(this.options.httpProxy && { httpProxy: this.options.httpProxy }),
      // ...(this.options.httpsProxy && { httpsProxy: this.options.httpsProxy }),
      // ...(this.options.caCerts && { caCerts: this.options.caCerts }),
    });
  }

  protected _setupIntegrations(): Record<string, Integration> {
    const integrations = collectIntegrations({
      defaultIntegrations: this.options.defaultIntegrations ? this.options._internal?.defaultIntegrations : [],
      discoveredIntegrations: this.options.discoverIntegrations ? this.options._internal?.discoveredIntegrations : [],
      userIntegrations: this.options.integrations ? this.options.integrations : [],
    });

    return integrations.reduce((integrationsIndex: Record<string, Integration>, integration) => {
      integrationsIndex[integration.name] = integration;
      integration.install(this);
      logger.log(`Integration installed: ${integration.name}`);
      return integrationsIndex;
    }, {});
  }

  /**
   * @inheritDoc
   */
  // TODO: Do we need generic here?
  protected _sendRequest<T>(request: TransportRequest<T>): void {
    this._transport.sendRequest(request).then(null, reason => {
      logger.error(`Failed sending request: ${reason}`);
    });
  }

  /** Updates existing session based on the provided event */
  protected _updateSessionFromEvent(session: Session, event: SentryEvent): void {
    let crashed = false;
    let errored = false;
    let userAgent;
    const exceptions = event.exception && event.exception.values;

    if (exceptions) {
      errored = true;

      for (const ex of exceptions) {
        const mechanism = ex.mechanism;
        if (mechanism && mechanism.handled === false) {
          crashed = true;
          break;
        }
      }
    }

    const user = event.user;
    if (!session.userAgent) {
      const headers = event.request ? event.request.headers : {};
      for (const key in headers) {
        if (key.toLowerCase() === 'user-agent') {
          userAgent = headers[key];
          break;
        }
      }
    }

    session.update({
      ...(crashed && { status: SessionStatus.Crashed }),
      user,
      userAgent,
      errors: session.errors + Number(errored || crashed),
    });
    this.captureSession(session);
  }

  /** Deliver captured session to Sentry */
  protected _sendSession(session: Session): void {
    this._sendRequest(sessionToTransportRequest(session));
  }

  /**
   * Applies `normalize` function on necessary `Event` attributes to make them safe for serialization.
   * Normalized keys:
   * - `breadcrumbs.data`
   * - `user`
   * - `contexts`
   * - `extra`
   * @param event Event
   * @returns Normalized event
   */
  protected _normalizeEvent(event: SentryEvent | null, depth: number): SentryEvent | null {
    if (!event) {
      return null;
    }

    const normalized = {
      ...event,
      ...(event.breadcrumbs && {
        breadcrumbs: event.breadcrumbs.map(b => ({
          ...b,
          ...(b.data && {
            data: normalize(b.data, depth),
          }),
        })),
      }),
      ...(event.user && {
        user: normalize(event.user, depth),
      }),
      ...(event.contexts && {
        contexts: normalize(event.contexts, depth),
      }),
      ...(event.extra && {
        extra: normalize(event.extra, depth),
      }),
    };
    // event.contexts.trace stores information about a Transaction. Similarly,
    // event.spans[] stores information about child Spans. Given that a
    // Transaction is conceptually a Span, normalization should apply to both
    // Transactions and Spans consistently.
    // For now the decision is to skip normalization of Transactions and Spans,
    // so this block overwrites the normalized event to add back the original
    // Transaction information prior to normalization.
    if (event.contexts && event.contexts.trace) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      normalized.contexts.trace = event.contexts.trace;
    }
    return normalized;
  }

  /**
   *  Enhances event using the client configuration.
   *  It takes care of all "static" values like environment, release and `dist`,
   *  as well as truncating overly long values.
   * @param event event instance to be enhanced
   */
  protected _applyClientOptions(event: SentryEvent): void {
    const options = this.options;
    const { environment, release, dist, maxValueLength = 250 } = options;

    if (!('environment' in event)) {
      event.environment = 'environment' in options ? environment : 'production';
    }

    if (event.release === undefined && release !== undefined) {
      event.release = release;
    }

    if (event.dist === undefined && dist !== undefined) {
      event.dist = dist;
    }

    if (event.message) {
      event.message = truncate(event.message, maxValueLength);
    }

    const exception = event.exception && event.exception.values && event.exception.values[0];
    if (exception && exception.value) {
      exception.value = truncate(exception.value, maxValueLength);
    }

    const request = event.request;
    if (request && request.url) {
      request.url = truncate(request.url, maxValueLength);
    }
  }

  protected _applySdkMetadata(event: SentryEvent): void {
    if (this.options._metadata?.sdk) {
      const { name, version, integrations, packages } = this.options._metadata?.sdk;

      event.sdk = event.sdk ?? {
        name,
        version,
      };
      event.sdk.name = event.sdk.name ?? name;
      event.sdk.version = event.sdk.version ?? version;
      event.sdk.integrations = [...(event.sdk.integrations || []), ...(integrations || [])];
      event.sdk.packages = [...(event.sdk.packages || []), ...(packages || [])];
    }
  }

  /**
   * This function adds all used integrations to the SDK info in the event.
   * @param event The event that will be filled with all integrations.
   */
  protected _applyIntegrationsMetadata(event: SentryEvent): void {
    const sdkInfo = event.sdk;
    const integrationsArray = Object.keys(this._integrations);
    if (sdkInfo && integrationsArray.length > 0) {
      sdkInfo.integrations = integrationsArray;
    }
  }

  /**
   * Tells the backend to send this event
   * @param event The Sentry event to send
   */
  protected _sendEvent(event: SentryEvent): void {
    this._sendRequest(eventToTransportRequest(event));
  }

  /**
   * Processes the event and logs an error in case of rejection
   * @param event
   * @param hint
   * @param scope
   */
  protected _captureEvent(event: SentryEvent, captureContext: CaptureContext): string | undefined {
    const processedEvent = this._processEvent(event, captureContext);

    if (!processedEvent) {
      return;
    }

    // TODO: Make it configurable or move to @sentry/integration-browser-breadcrumbs
    const eventType = processedEvent.type === 'transaction' ? 'transaction' : 'event';
    this.getScope().addBreadcrumb(
      {
        category: `sentry.${eventType}`,
        event_id: processedEvent.event_id,
        level: processedEvent.level,
        message: getEventDescription(processedEvent),
      },
      {
        event: processedEvent,
      },
    );
    return processedEvent.event_id;
  }

  /**
   * Processes an event (either error or message) and sends it to Sentry.
   *
   * This also adds breadcrumbs and context information to the event. However,
   * platform specific meta data (such as the User's IP address) must be added
   * by the SDK implementor.
   *
   *
   * @param event The event to send to Sentry.
   * @param hint May contain additional information about the original exception.
   * @param scope A scope containing event metadata.
   * @returns A Promise that resolves with the event or rejects in case event was/will not be send.
   */
  // eslint-disable-next-line complexity
  protected _processEvent(event: SentryEvent, captureContext: CaptureContext): SentryEvent | null {
    if (this.options.enabled === false) {
      logger.error('SDK not enabled, will not send event.');
      return null;
    }

    const isTransaction = event.type === 'transaction';
    // 1.0 === 100% events are sent
    // 0.0 === 0% events are sent
    // Sampling for transaction happens somewhere else
    if (!isTransaction && typeof this.options.sampleRate === 'number' && Math.random() > this.options.sampleRate) {
      logger.error(
        `Discarding event because it's not included in the random sample (sampling rate = ${this.options.sampleRate})`,
      );
      return null;
    }

    try {
      let processedEvent: SentryEvent | null = {
        ...event,
        event_id: event.event_id ?? uuid4(),
        timestamp: event.timestamp ?? dateTimestampInSeconds(),
      };

      this._applyClientOptions(processedEvent);
      this._applySdkMetadata(processedEvent);
      this._applyIntegrationsMetadata(processedEvent);

      const scope =
        captureContext.scope instanceof Scope
          ? captureContext.scope
          : this.getScope()
              .clone()
              .update(captureContext.scope);

      processedEvent = scope.applyToEvent(processedEvent, captureContext.hint);
      if (processedEvent === null) {
        logger.error('A scope event processor returned null, will not send event.');
        return null;
      }

      for (const processor of this._eventProcessors) {
        if (typeof processor === 'function') {
          const nextEvent = processor(processedEvent, captureContext.hint);
          if (nextEvent === null) {
            logger.error('A client event processor returned null, will not send event.');
            return null;
          }
          processedEvent = nextEvent;
        }
      }

      if (processedEvent === null) {
        logger.error('A scope event processor returned null, will not send event.');
        return null;
      }

      const normalizeDepth = this.options.normalizeDepth ?? 3;
      if (typeof normalizeDepth === 'number' && normalizeDepth > 0) {
        processedEvent = this._normalizeEvent(processedEvent, normalizeDepth);
      }

      const isInternalException = captureContext?.hint?.data?.__sentry__ === true;
      if (isInternalException || isTransaction || !this.options.beforeSend) {
        return processedEvent;
      }

      processedEvent = this.options.beforeSend(processedEvent as SentryEvent, captureContext?.hint);

      if (!(isPlainObject(processedEvent) || processedEvent === null)) {
        logger.error('`beforeSend` method has to return `null` or a valid event.');
        return null;
      }

      if (processedEvent === null) {
        logger.error('`beforeSend` returned `null`, will not send event.');
        return null;
      }

      const session = this.getScope().getSession();
      if (!isTransaction && session) {
        this._updateSessionFromEvent(session as Session, processedEvent);
      }

      this._sendEvent(processedEvent);

      return processedEvent;
    } catch (e) {
      this.captureException(e, {
        hint: {
          data: {
            __sentry__: true,
          },
          originalException: e,
        },
      });
      logger.error(
        `Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.\nReason: ${e}`,
      );
      return null;
    }
  }

  protected abstract _eventFromException(exception: unknown, captureContext: CaptureContext): SentryEvent;
  protected abstract _eventFromMessage(message: string, captureContext: CaptureContext): SentryEvent;
}
