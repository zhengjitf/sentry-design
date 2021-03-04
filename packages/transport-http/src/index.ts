import * as http from 'http';
import * as https from 'https';
// import { readFileSync } from 'fs';
import { URL } from 'url';

import {
  BaseTransport,
  Transport,
  TransportOptions,
  TransportRequest,
  TransportRequestMaker,
  TransportResponse,
} from '@sentry/transport-base';

// TODO: Unify all transports options
type HTTPTransportOptions = TransportOptions & {
  requestOptions?: https.RequestOptions;
  proxy?: string;
  caCerts?: string;
};

// TODO: `x-sentry-error` header?

export class HTTPTransport extends BaseTransport implements Transport {
  constructor(private readonly _options: HTTPTransportOptions) {
    super(_options);
  }

  public sendRequest<T>(request: TransportRequest<T>): PromiseLike<TransportResponse> {
    const requestMaker: TransportRequestMaker<T> = request => {
      return new Promise((resolve, reject) => {
        const { hostname, pathname, port, protocol } = new URL(this._dsn.getEnvelopeEndpoint());
        const httpModule = protocol === 'https:' ? https : http;
        const proxy = this._options.proxy || process.env.http_proxy;
        const agent = proxy
          ? new (require('https-proxy-agent'))(proxy)
          : new httpModule.Agent({ keepAlive: false, maxSockets: 30, timeout: 2000 });

        const requestOptions: https.RequestOptions = {
          agent,
          hostname,
          method: 'POST',
          path: pathname,
          port,
          protocol,
          headers: {
            ...this._options.headers,
            ...this._dsn.getEnvelopeEndpointAuthHeaders(),
          },
          // ...this._options.requestOptions,
          // TODO: Handle and cache CA certs?
          // ...(this._options.caCerts && {
          //   ca: readFileSync(this._options.caCerts),
          // }),
        };

        // TODO: Add gzip compresison
        const req = httpModule.request(requestOptions, (res: http.IncomingMessage) => {
          res.setEncoding('utf8');

          let body = '';
          res.on('data', chunk => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({
              body,
              headers: {
                'x-sentry-rate-limits': res.headers['X-Sentry-Rate-Limits'] as string,
                'retry-after': res.headers['Retry-After'] as string,
              },
              reason: res.statusMessage,
              statusCode: res.statusCode || 500,
            });
          });
        });

        req.on('error', error => reject(error));
        req.end(request.body);
      });
    };

    return super.sendRequest(request, requestMaker);
  }
}
