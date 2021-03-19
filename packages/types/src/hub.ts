import { ClientLike } from './client';
import { SentryEvent, EventHint } from './event';
import { Integration, IntegrationClass } from './integration';
import { ScopeLike } from './scope';
import { Session, SessionContext } from './session';
import { Severity } from './severity';
import { Span, SpanContext } from './span';
import { CustomSamplingContext, Transaction, TransactionContext } from './transaction';

/**
 * Internal class used to make sure we always have the latest internal functions
 * working in case we have a version conflict.
 */
export interface Hub {
  /**
   * Checks if this hub's version is older than the given version.
   *
   * @param version A version number to compare to.
   * @return True if the given version is newer; otherwise false.
   *
   * @hidden
   */
  isOlderThan(version: number): boolean;

  /**
   * This binds the given client to the current scope.
   * @param client An SDK client (client) instance.
   */
  bindClient(client?: ClientLike): void;

  /**
   * Create a new scope to store context information.
   *
   * The scope will be layered on top of the current one. It is isolated, i.e. all
   * breadcrumbs and context information added to this scope will be removed once
   * the scope ends. Be sure to always remove this scope with {@link this.popScope}
   * when the operation finishes or throws.
   *
   * @returns Scope, the new cloned scope
   */
  pushScope(): ScopeLike;

  /**
   * Removes a previously pushed scope from the stack.
   *
   * This restores the state before the scope was pushed. All breadcrumbs and
   * context information added since the last call to {@link this.pushScope} are
   * discarded.
   */
  popScope(): boolean;

  /**
   * Creates a new scope with and executes the given operation within.
   * The scope is automatically removed once the operation
   * finishes or throws.
   *
   * This is essentially a convenience function for:
   *
   *     pushScope();
   *     callback();
   *     popScope();
   *
   * @param callback that will be enclosed into push/popScope.
   */
  withScope(callback: (scope: ScopeLike) => void): void;

  /** Returns the client of the top stack. */
  getClient(): ClientLike | undefined;

  /**
   * Captures an exception event and sends it to Sentry.
   *
   * @param exception An exception-like object.
   * @param hint May contain additional information about the original exception.
   * @returns The generated eventId.
   */
  captureException(exception: any, hint?: EventHint): string;

  /**
   * Captures a message event and sends it to Sentry.
   *
   * @param message The message to send to Sentry.
   * @param level Define the level of the message.
   * @param hint May contain additional information about the original exception.
   * @returns The generated eventId.
   */
  captureMessage(message: string, level?: Severity, hint?: EventHint): string;

  /**
   * Captures a manually created event and sends it to Sentry.
   *
   * @param event The event to send to Sentry.
   * @param hint May contain additional information about the original exception.
   */
  captureEvent(event: SentryEvent, hint?: EventHint): string;

  /**
   * This is the getter for lastEventId.
   *
   * @returns The last event id of a captured event.
   */
  lastEventId(): string | undefined;

  /**
   * Callback to set context information onto the scope.
   *
   * @param callback Callback function that receives Scope.
   */
  configureScope(callback: (scope: ScopeLike) => void): void;

  /**
   * For the duraction of the callback, this hub will be set as the global current Hub.
   * This function is useful if you want to run your own client and hook into an already initialized one
   * e.g.: Reporting issues to your own sentry when running in your component while still using the users configuration.
   */
  run(callback: (hub: Hub) => void): void;

  /** Returns the integration if installed on the current client. */
  getIntegration<T extends Integration>(integration: IntegrationClass<T>): T | null;

  /** Returns all trace headers that are currently on the top scope. */
  traceHeaders(): { [key: string]: string };

  /**
   * @deprecated No longer does anything. Use use {@link Transaction.startChild} instead.
   */
  startSpan(context: SpanContext): Span;

  /**
   * Starts a new `Transaction` and returns it. This is the entry point to manual tracing instrumentation.
   *
   * A tree structure can be built by adding child spans to the transaction, and child spans to other spans. To start a
   * new child span within the transaction or any span, call the respective `.startChild()` method.
   *
   * Every child span must be finished before the transaction is finished, otherwise the unfinished spans are discarded.
   *
   * The transaction must be finished with a call to its `.finish()` method, at which point the transaction with all its
   * finished child spans will be sent to Sentry.
   *
   * @param context Properties of the new `Transaction`.
   * @param customSamplingContext Information given to the transaction sampling function (along with context-dependent
   * default values). See {@link Options.tracesSampler}.
   *
   * @returns The transaction which was just started
   */
  startTransaction(context: TransactionContext, customSamplingContext?: CustomSamplingContext): Transaction;

  /**
   * Starts a new `Session`, sets on the current scope and returns it.
   *
   * To finish a `session`, it has to be passed directly to `client.captureSession`, which is done automatically
   * when using `hub.endSession()` for the session currently stored on the scope.
   *
   * When there's already an existing session on the scope, it'll be automatically ended.
   *
   * @param context Optional properties of the new `Session`.
   *
   * @returns The session which was just started
   */
  startSession(context?: SessionContext): Session;

  /**
   * Ends the session that lives on the current scope and sends it to Sentry
   */
  endSession(): void;

  /**
   * Sends the current session on the scope to Sentry
   * @param endSession If set the session will be marked as exited and removed from the scope
   */
  captureSession(endSession: boolean): void;
}
