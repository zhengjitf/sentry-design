import { EventType, TransportMakeRequestResponse, TransportOptions, TransportRequest } from '@sentry/types';

import { AsyncBuffer } from '../src/asyncBuffer';
import { BaseTransport } from '../src/index';
import { ResponseStatus } from '../src/responseStatus';

function makeTransport(opts: TransportOptions, rv: TransportMakeRequestResponse) {
  class TestTransport extends BaseTransport {
    protected _makeRequest<T>(_request: TransportRequest<T>): PromiseLike<TransportMakeRequestResponse> {
      return Promise.resolve(rv);
    }
  }
  return new TestTransport(opts);
}

describe('BaseTransport', () => {
  const dsn = 'http://1337@sentry.io/123';

  describe('sendRequest()', () => {
    test('should call provided callback with the request if there is space in the buffer', async () => {
      const transport = makeTransport({ dsn }, { statusCode: 200 });
      const request = { body: 'hi', type: EventType.Error };
      await expect(transport.sendRequest(request)).resolves.toEqual({ status: ResponseStatus.Success });
    });

    test('should not call provided callback if there is no space left in the buffer', async () => {
      const transport = makeTransport({ dsn, bufferSize: 0 }, { statusCode: 200 });
      const request = { body: 'hi', type: EventType.Error };
      await expect(transport.sendRequest(request)).rejects.toThrowError('Not adding task due to buffer limit reached.');
    });

    test('should reject with a reason if provided callback resolves with non-success response code', async () => {
      const transport = makeTransport({ dsn }, { statusCode: 500, reason: 'because' });
      const request = { body: 'hi', type: EventType.Error };
      await expect(transport.sendRequest(request)).rejects.toThrowError('because');
    });

    test('should reject with a fallback reason if provided callback resolves with non-success response code and no specific reason', async () => {
      const transport = makeTransport({ dsn }, { statusCode: 500 });
      const request = { body: 'hi', type: EventType.Error };
      await expect(transport.sendRequest(request)).rejects.toThrowError('Unknown transport error');
    });

    test('should update internal rate limits and reject request if rate limited', async () => {
      const transport = makeTransport(
        { dsn },
        {
          statusCode: 200,
          headers: {
            'x-sentry-rate-limits': '1337:error',
          },
        },
      );
      const request = { body: 'hi', type: EventType.Error };
      await transport.sendRequest(request);
      await expect(transport.sendRequest(request)).rejects.toThrowError(
        /Transport for `error` locked till \d+ due to too many requests./,
      );
    });
  });

  describe('flush()', () => {
    test('should forward call to `AsyncBuffer.drain` passing the timeout argument', async () => {
      const transport = makeTransport({ dsn }, { statusCode: 200 });
      const drainSpy = jest.spyOn(AsyncBuffer.prototype, 'drain');
      await transport.flush(1);
      expect(drainSpy).toHaveBeenCalledWith(1);
    });
  });
});
