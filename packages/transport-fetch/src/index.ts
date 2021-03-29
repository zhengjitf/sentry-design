import { BaseTransport } from '@sentry/transport-base';
import { Transport, TransportOptions, TransportRequest, TransportRequestMaker, TransportResponse } from '@sentry/types';

export class FetchTransport extends BaseTransport implements Transport {
  constructor(private readonly _options: TransportOptions) {
    super(_options);
  }

  public sendRequest<T>(request: TransportRequest<T>): PromiseLike<TransportResponse> {
    const requestMaker: TransportRequestMaker<T> = request => {
      const body = (request.body as unknown) as BodyInit;
      const requestOptions: RequestInit = {
        body,
        method: 'POST',
        referrerPolicy: 'origin',
        headers: this._options.headers,
      };

      if (this._options.credentials) {
        requestOptions.credentials = this._options.credentials as RequestCredentials;
      }

      return fetch(this._dsn.getEnvelopeEndpoint(), requestOptions).then(async response => {
        return {
          body: await response.text(),
          headers: {
            'x-sentry-rate-limits': response.headers.get('X-Sentry-Rate-Limits'),
            'retry-after': response.headers.get('Retry-After'),
          },
          reason: response.statusText,
          statusCode: response.status,
        };
      });
    };

    return super.sendRequest(request, requestMaker);
  }
}
