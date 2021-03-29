import { getCurrentClient } from '@sentry/minimal';
import {
  SentryEvent,
  Measurements,
  Transaction as TransactionInterface,
  TransactionContext,
  ClientLike,
  EventType,
} from '@sentry/types';
import { dropUndefinedKeys } from '@sentry/utils';

import { Span as SpanClass, SpanRecorder } from './span';

interface TransactionMetadata {
  transactionSampling?: { [key: string]: string | number };
}

export class Transaction extends SpanClass implements TransactionInterface {
  public name: string;

  // TODO: Making this reference isnt the best choice, but we need an access to client in start.ts for logging
  public client?: ClientLike;

  private _metadata: TransactionMetadata = {};
  private _measurements: Measurements = {};
  private _trimEnd?: boolean;

  /**
   * This constructor should never be called manually. Those instrumenting tracing should use
   * `Sentry.startTransaction()`, and internal methods should use `startTransaction` from `@sentry/tracing`.
   * @internal
   * @hideconstructor
   * @hidden
   */
  public constructor(transactionContext: TransactionContext, client?: ClientLike) {
    super(transactionContext);

    this.client = client ?? getCurrentClient();

    this.name = transactionContext.name || '';

    this._trimEnd = transactionContext.trimEnd;

    // this is because transactions are also spans, and spans have a transaction pointer
    this.transaction = this;
  }

  public setName(name: string): void {
    this.name = name;
  }

  /**
   * Attaches SpanRecorder to the span itself
   * @param maxlen maximum number of spans that can be recorded
   */
  public initSpanRecorder(maxlen: number = 1000): void {
    if (!this.spanRecorder) {
      this.spanRecorder = new SpanRecorder(maxlen);
    }
    this.spanRecorder.add(this);
  }

  /**
   * Set observed measurements for this transaction.
   * @hidden
   */
  public setMeasurements(measurements: Measurements): void {
    this._measurements = { ...measurements };
  }

  /**
   * Set metadata for this transaction.
   * @hidden
   */
  public setMetadata(newMetadata: TransactionMetadata): void {
    this._metadata = { ...this._metadata, ...newMetadata };
  }

  /**
   * @inheritDoc
   */
  public finish(endTimestamp?: number): string | undefined {
    // This transaction is already finished, so we should not flush it again.
    if (this.endTimestamp !== undefined) {
      return undefined;
    }

    if (!this.name) {
      this.client?.logger.warn('Transaction has no name, falling back to `<unlabeled transaction>`.');
      this.name = '<unlabeled transaction>';
    }

    // just sets the end timestamp
    super.finish(endTimestamp);

    if (this.sampled !== true) {
      // At this point if `sampled !== true` we want to discard the transaction.
      this.client?.logger.log('[Tracing] Discarding transaction because its trace was not chosen to be sampled.');
      return undefined;
    }

    const finishedSpans = this.spanRecorder ? this.spanRecorder.spans.filter(s => s !== this && s.endTimestamp) : [];

    if (this._trimEnd && finishedSpans.length > 0) {
      this.endTimestamp = finishedSpans.reduce((prev: SpanClass, current: SpanClass) => {
        if (prev.endTimestamp && current.endTimestamp) {
          return prev.endTimestamp > current.endTimestamp ? prev : current;
        }
        return prev;
      }).endTimestamp;
    }

    const transaction: SentryEvent = {
      contexts: {
        trace: this.getTraceContext(),
      },
      spans: finishedSpans,
      start_timestamp: this.startTimestamp,
      tags: this.tags,
      timestamp: this.endTimestamp,
      transaction: this.name,
      type: EventType.Transaction,
      debug_meta: this._metadata,
    };

    const hasMeasurements = Object.keys(this._measurements).length > 0;

    if (hasMeasurements) {
      this.client?.logger.log(
        '[Measurements] Adding measurements to transaction',
        JSON.stringify(this._measurements, undefined, 2),
      );
      transaction.measurements = this._measurements;
    }

    return this.client?.captureEvent(transaction);
  }

  /**
   * @inheritDoc
   */
  public toContext(): TransactionContext {
    const spanContext = super.toContext();

    return dropUndefinedKeys({
      ...spanContext,
      name: this.name,
      trimEnd: this._trimEnd,
    });
  }

  /**
   * @inheritDoc
   */
  public updateWithContext(transactionContext: TransactionContext): this {
    super.updateWithContext(transactionContext);

    this.name = transactionContext.name ?? '';

    this._trimEnd = transactionContext.trimEnd;

    return this;
  }
}
