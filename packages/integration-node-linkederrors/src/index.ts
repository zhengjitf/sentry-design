import { ClientLike, EventHint, Exception, ExtendedError, Integration, SentryEvent } from '@sentry/types';
import { isInstanceOf } from '@sentry/utils';
import { getExceptionFromError } from '@sentry/eventbuilder-node';

export class LinkedErrors implements Integration {
  public name = this.constructor.name;

  private readonly _key: string;
  private readonly _limit: number;

  public constructor(options: { key?: string; limit?: number } = {}) {
    this._key = options.key || 'cause';
    this._limit = options.limit ?? 5;
  }

  public install(client: ClientLike): void {
    client.addEventProcessor((event: SentryEvent, hint?: EventHint) => this.process(event, hint));
  }

  public process(event: SentryEvent, hint?: EventHint): SentryEvent {
    if (!event.exception || !event.exception.values || !hint || !isInstanceOf(hint.originalException, Error)) {
      return event;
    }
    const linkedErrors = this._walkErrorTree(hint.originalException as ExtendedError, this._key);
    event.exception.values = [...linkedErrors, ...event.exception.values];
    return event;
  }

  private _walkErrorTree(error: ExtendedError, key: string, stack: Exception[] = []): Exception[] {
    if (!isInstanceOf(error[key], Error) || stack.length + 1 >= this._limit) {
      return stack;
    }
    const exception = getExceptionFromError(error[key]);
    return this._walkErrorTree(error[key], key, [exception, ...stack]);
  }
}
