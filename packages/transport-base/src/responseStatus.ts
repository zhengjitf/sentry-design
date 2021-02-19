export enum ResponseStatus {
  Unknown = 'unknown',
  Skipped = 'skipped',
  Success = 'success',
  RateLimit = 'rate_limit',
  Invalid = 'invalid',
  Failed = 'failed',
}

export function responseStatusFromStatusCode(code: number): ResponseStatus {
  if (code >= 200 && code < 300) {
    return ResponseStatus.Success;
  }

  if (code === 429) {
    return ResponseStatus.RateLimit;
  }

  if (code >= 400 && code < 500) {
    return ResponseStatus.Invalid;
  }

  if (code >= 500) {
    return ResponseStatus.Failed;
  }

  return ResponseStatus.Unknown;
}
