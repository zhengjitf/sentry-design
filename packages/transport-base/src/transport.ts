import { Transport, TransportOptions, TransportResponse, TransportRequest, TransportRequestMaker } from '@sentry/types';

import { Dsn } from './dsn';
import { isRateLimited, updateRateLimits, RateLimits, disabledUntil } from './rateLimit';
import { AsyncBuffer } from './asyncBuffer';
import { ResponseStatus, responseStatusFromStatusCode } from './responseStatus';

export abstract class BaseTransport {
  protected readonly _dsn: Dsn;
  protected readonly _asyncBuffer: AsyncBuffer<TransportResponse>;
  protected _rateLimits: RateLimits = {};

  public constructor(public options: TransportOptions) {
    this._dsn = new Dsn(this.options.dsn);
    // this._dsn = typeof this.options.dsn === 'string' ? new Dsn(this.options.dsn) : this.options.dsn;
    this._asyncBuffer = new AsyncBuffer(this.options.bufferSize ?? 30);
  }

  public sendRequest<T>(
    request: TransportRequest<T>,
    requestMaker: TransportRequestMaker<T>,
  ): PromiseLike<TransportResponse> {
    if (isRateLimited(this._rateLimits, request.type)) {
      // TODO: Use SentryError
      return Promise.reject(
        new Error(
          `Transport for \`${request.type}\` locked till ${disabledUntil(
            this._rateLimits,
            request.type,
          )} due to too many requests.`,
        ),
      );
    }

    /**
     * We need to create a request _only_ once it's called.
     * This makes sure that requests are correctly dropped,
     * and they are not making any network calls when the buffer is full.
     */
    const sendRequestTask = (): PromiseLike<TransportResponse> => {
      return requestMaker(request).then(
        ({ body, headers, statusCode, reason }): PromiseLike<TransportResponse> => {
          if (headers) {
            this._rateLimits = updateRateLimits(this._rateLimits, headers);
          }

          const status = responseStatusFromStatusCode(statusCode);

          if (status === ResponseStatus.Success) {
            return Promise.resolve({ status });
          }

          // TODO: Use SentryError
          return Promise.reject(new Error(body ?? reason ?? 'Unknown transport error'));
        },
      );
    };

    return this._asyncBuffer.add(sendRequestTask);
  }

  // TODO: Make requestMaker an abstract method that has to be implemented by the class that extends it?
  public flush(timeout: number = 0): PromiseLike<boolean> {
    return this._asyncBuffer.drain(timeout);
  }
}

export class NoopTransport implements Transport {
  public sendRequest(_request: TransportRequest<unknown>): PromiseLike<TransportResponse> {
    return Promise.resolve({
      reason: `NoopTransport: SentryEvent has been skipped because no Dsn is configured.`,
      status: ResponseStatus.Skipped,
    });
  }

  public flush(_timeout: number): PromiseLike<boolean> {
    return Promise.resolve(true);
  }
}
