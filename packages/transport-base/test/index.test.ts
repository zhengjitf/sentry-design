import { AsyncBuffer } from '../src/asyncBuffer';
import { BaseTransport, EventType } from '../src/index';
import { ResponseStatus } from '../src/responseStatus';

class TestTransport extends BaseTransport {}

describe('BaseTransport', () => {
  const dsn = 'http://1337@sentry.io/123';
  let transport: TestTransport;

  beforeEach(() => {
    transport = new TestTransport({ dsn });
  });

  describe('sendRequest()', () => {
    test('should call provided callback with the request if there is space in the buffer', async () => {
      const request = { body: 'hi', type: EventType.Error };
      const requestMaker = jest.fn(() => Promise.resolve({ statusCode: 200 }));
      await expect(transport.sendRequest(request, requestMaker)).resolves.toEqual({ status: ResponseStatus.Success });
      expect(requestMaker).toHaveBeenCalledWith(request);
    });

    test('should not call provided callback if there is no space left in the buffer', async () => {
      transport = new TestTransport({ dsn, bufferSize: 0 });
      const request = { body: 'hi', type: EventType.Error };
      const requestMaker = jest.fn(() => Promise.resolve({ statusCode: 200 }));
      await expect(transport.sendRequest(request, requestMaker)).rejects.toThrowError(
        'Not adding task due to buffer limit reached.',
      );
      expect(requestMaker).not.toHaveBeenCalled();
    });

    test('should reject with a reason if provided callback resolves with non-success response code', async () => {
      const request = { body: 'hi', type: EventType.Error };
      const requestMaker = () => Promise.resolve({ statusCode: 500, reason: 'because' });
      await expect(transport.sendRequest(request, requestMaker)).rejects.toThrowError('because');
    });

    test('should reject with a fallback reason if provided callback resolves with non-success response code and no specific reason', async () => {
      const request = { body: 'hi', type: EventType.Error };
      const requestMaker = () => Promise.resolve({ statusCode: 500 });
      await expect(transport.sendRequest(request, requestMaker)).rejects.toThrowError('Unknown transport error');
    });

    test('should update internal rate limits and reject request if rate limited', async () => {
      const request = { body: 'hi', type: EventType.Error };
      await transport.sendRequest(request, () =>
        Promise.resolve({
          statusCode: 200,
          headers: {
            'x-sentry-rate-limits': '1337:error',
          },
        }),
      );
      await expect(transport.sendRequest(request, () => Promise.resolve({ statusCode: 200 }))).rejects.toThrowError(
        /Transport for `error` locked till \d+ due to too many requests./,
      );
    });
  });

  describe('flush()', () => {
    test('should forward call to `AsyncBuffer.drain` passing the timeout argument', async () => {
      const drainSpy = jest.spyOn(AsyncBuffer.prototype, 'drain');
      await transport.flush(1);
      expect(drainSpy).toHaveBeenCalledWith(1);
    });
  });
});
