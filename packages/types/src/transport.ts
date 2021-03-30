import { EventType } from './event';

export enum ResponseStatus {
  Unknown = 'unknown',
  Skipped = 'skipped',
  Success = 'success',
  RateLimit = 'rate_limit',
  Invalid = 'invalid',
  Failed = 'failed',
}

export type TransportRequest<T> = {
  body: T;
  type: EventType;
};

export type TransportMakeRequestResponse = {
  body?: string;
  headers?: Record<string, string | null>;
  reason?: string;
  statusCode: number;
};

export type TransportResponse = {
  status: ResponseStatus;
  reason?: string;
};

// Transport generic over `T` allows us to use `Buffer` type for streaming requests in environments like Electron.
export interface Transport {
  sendRequest<T>(request: TransportRequest<T>): PromiseLike<TransportResponse>;
  flush(timeout: number): PromiseLike<boolean>;
}

// TODO: Should we just do `[key: string]: unknown` and call it a day? ¯\_(ツ)_/¯
export type TransportOptions = {
  dsn: string;
  /** Set a HTTP proxy that should be used for outbound requests. */
  proxy?: string;
  /** HTTPS proxy certificates path */
  caCerts?: string;
  /** Fetch API init parameters */
  credentials?: string;
  headers?: Record<string, string>;
  bufferSize?: number;
};
