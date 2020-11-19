import { SyncPromise } from '@sentry/utils';

import { Event, SentryResponseData, Status } from '../../../src';
import { BaseTransport } from '../../../src/transports';

export class SimpleTransport extends BaseTransport {
  public sendEvent(_: Event): PromiseLike<SentryResponseData> {
    return this._buffer.add(
      SyncPromise.resolve({
        status: Status.fromHttpCode(200),
      }),
    );
  }
}
