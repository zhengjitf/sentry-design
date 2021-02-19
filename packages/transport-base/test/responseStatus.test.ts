import { ResponseStatus, responseStatusFromStatusCode } from '../src/responseStatus';

describe('responseStatusFromStatusCode()', () => {
  test('ResponseStatus.Success', () => {
    expect(responseStatusFromStatusCode(199)).not.toEqual(ResponseStatus.Success);
    expect(responseStatusFromStatusCode(200)).toEqual(ResponseStatus.Success);
    expect(responseStatusFromStatusCode(299)).toEqual(ResponseStatus.Success);
    expect(responseStatusFromStatusCode(300)).not.toEqual(ResponseStatus.Success);
  });

  test('ResponseStatus.RateLimit', () => {
    expect(responseStatusFromStatusCode(429)).toEqual(ResponseStatus.RateLimit);
  });

  test('ResponseStatus.Invalid', () => {
    expect(responseStatusFromStatusCode(399)).not.toEqual(ResponseStatus.Invalid);
    expect(responseStatusFromStatusCode(400)).toEqual(ResponseStatus.Invalid);
    expect(responseStatusFromStatusCode(429)).not.toEqual(ResponseStatus.Invalid);
    expect(responseStatusFromStatusCode(499)).toEqual(ResponseStatus.Invalid);
    expect(responseStatusFromStatusCode(500)).not.toEqual(ResponseStatus.Invalid);
  });

  test('ResponseStatus.Failed', () => {
    expect(responseStatusFromStatusCode(499)).not.toEqual(ResponseStatus.Failed);
    expect(responseStatusFromStatusCode(500)).toEqual(ResponseStatus.Failed);
    expect(responseStatusFromStatusCode(501)).toEqual(ResponseStatus.Failed);
  });

  test('ResponseStatus.Unknown', () => {
    expect(responseStatusFromStatusCode(199)).toEqual(ResponseStatus.Unknown);
    expect(responseStatusFromStatusCode(300)).toEqual(ResponseStatus.Unknown);
    expect(responseStatusFromStatusCode(399)).toEqual(ResponseStatus.Unknown);
    expect(responseStatusFromStatusCode(520)).not.toEqual(ResponseStatus.Unknown);
  });
});
