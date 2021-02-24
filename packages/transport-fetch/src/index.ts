import {
  BaseTransport,
  Transport,
  TransportOptions,
  TransportRequest,
  TransportRequestMaker,
  TransportResponse,
} from '@sentry/transport-base';

// TODO: Unify all transports options
type FetchTransportOptions = TransportOptions & {
  requestOptions?: RequestInit;
};

export class FetchTransport extends BaseTransport implements Transport {
  constructor(private readonly _options: FetchTransportOptions) {
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
        ...this._options.requestOptions,
      };

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
