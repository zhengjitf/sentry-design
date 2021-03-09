import { getCurrentHub } from '@sentry/hub';
import { addGlobalEventProcessor } from '@sentry/minimal';
import { SentryEvent, EventHint, Exception, ExtendedError, Integration } from '@sentry/types';
import { isInstanceOf } from '@sentry/utils';
import { computeStackTrace, exceptionFromStacktrace } from '@sentry/eventbuilder-browser';

const DEFAULT_KEY = 'cause';
const DEFAULT_LIMIT = 5;

// TODO: Make it built-in (?)

/** Adds SDK info to an event. */
export class LinkedErrors implements Integration {
  /**
   * @inheritDoc
   */
  public static id: string = 'LinkedErrors';

  /**
   * @inheritDoc
   */
  public readonly name: string = LinkedErrors.id;

  /**
   * @inheritDoc
   */
  private readonly _key: string;

  /**
   * @inheritDoc
   */
  private readonly _limit: number;

  /**
   * @inheritDoc
   */
  public constructor(options: { key?: string; limit?: number } = {}) {
    this._key = options.key || DEFAULT_KEY;
    this._limit = options.limit || DEFAULT_LIMIT;
  }

  /**
   * @inheritDoc
   */
  public setupOnce(): void {
    addGlobalEventProcessor((event: SentryEvent, hint?: EventHint) => {
      const self = getCurrentHub().getIntegration(LinkedErrors);
      if (self) {
        return self._handler(event, hint);
      }
      return event;
    });
  }

  /**
   * @inheritDoc
   */
  private _handler(event: SentryEvent, hint?: EventHint): SentryEvent | null {
    if (!event.exception || !event.exception.values || !hint || !isInstanceOf(hint.originalException, Error)) {
      return event;
    }
    const linkedErrors = this._walkErrorTree(hint.originalException as ExtendedError, this._key);
    event.exception.values = [...linkedErrors, ...event.exception.values];
    return event;
  }

  /**
   * @inheritDoc
   */
  private _walkErrorTree(error: ExtendedError, key: string, stack: Exception[] = []): Exception[] {
    if (!isInstanceOf(error[key], Error) || stack.length + 1 >= this._limit) {
      return stack;
    }
    const stacktrace = computeStackTrace(error[key]);
    const exception = exceptionFromStacktrace(stacktrace);
    return this._walkErrorTree(error[key], key, [exception, ...stack]);
  }
}
