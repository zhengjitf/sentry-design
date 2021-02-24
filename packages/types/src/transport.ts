enum ResponseStatus {
  Unknown = 'unknown',
  Skipped = 'skipped',
  Success = 'success',
  RateLimit = 'rate_limit',
  Invalid = 'invalid',
  Failed = 'failed',
}

enum EventType {
  Error = 'error',
  Session = 'session',
  Transaction = 'transaction',
}

type TransportRequest<T> = {
  body: T;
  type: EventType;
};

type TransportResponse = {
  status: ResponseStatus;
  reason?: string;
};

/** Transport used sending data to Sentry */
export interface Transport {
  sendRequest<T>(request: TransportRequest<T>): PromiseLike<TransportResponse>;
  flush(timeout: number): PromiseLike<boolean>;
}

export type TransportClass<T extends Transport> = new (options: TransportOptions) => T;

export type TransportOptions = {
  dsn: string;
  bufferSize?: number;
  headers?: Record<string, string>;
};
