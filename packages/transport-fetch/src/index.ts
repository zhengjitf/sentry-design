import { BaseTransport } from '@sentry/transport-base';
import { Transport, TransportRequest, TransportMakeRequestResponse } from '@sentry/types';

export class FetchTransport extends BaseTransport implements Transport {
  protected _makeRequest<T>(request: TransportRequest<T>): PromiseLike<TransportMakeRequestResponse> {
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

    return fetch(this._dsn.getEnvelopeEndpoint(), requestOptions).then(response => {
      return response.text().then(body => ({
        body,
        headers: {
          'x-sentry-rate-limits': response.headers.get('X-Sentry-Rate-Limits'),
          'retry-after': response.headers.get('Retry-After'),
        },
        reason: response.statusText,
        statusCode: response.status,
      }));
    });
  }
}
