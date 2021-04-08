import { getEventDescription, getGlobalObject, parseRetryAfterHeader, stripUrlQueryAndFragment } from '../src/misc';

describe('getEventDescription()', () => {
  test('message event', () => {
    expect(
      getEventDescription({
        message: 'Random message',
        exception: {
          values: [
            {
              type: 'SyntaxError',
              value: 'wat',
            },
          ],
        },
      }),
    ).toEqual('Random message');
  });

  test('exception event with just type', () => {
    expect(
      getEventDescription({
        exception: {
          values: [
            {
              type: 'SyntaxError',
            },
          ],
        },
      }),
    ).toEqual('SyntaxError');
  });

  test('exception event with just value', () => {
    expect(
      getEventDescription({
        exception: {
          values: [
            {
              value: 'wat',
            },
          ],
        },
      }),
    ).toEqual('wat');
  });

  test('exception event with type and value', () => {
    expect(
      getEventDescription({
        exception: {
          values: [
            {
              type: 'SyntaxError',
              value: 'wat',
            },
          ],
        },
      }),
    ).toEqual('SyntaxError: wat');
  });

  test('exception event with invalid type and value, but with event_id', () => {
    expect(
      getEventDescription({
        exception: {
          values: [
            {
              type: undefined,
              value: undefined,
            },
          ],
        },
        event_id: '123',
      }),
    ).toEqual('123');
  });

  test('exception event with invalid type and value and no event_id', () => {
    expect(
      getEventDescription({
        exception: {
          values: [
            {
              type: undefined,
              value: undefined,
            },
          ],
        },
      }),
    ).toEqual('<unknown>');
  });

  test('malformed event with just event_id', () => {
    expect(
      getEventDescription({
        event_id: '123',
      }),
    ).toEqual('123');
  });

  test('completely malformed event', () => {
    expect(
      getEventDescription({
        oh: 'come, on',
        really: '?',
      } as any),
    ).toEqual('<unknown>');
  });
});

describe('getGlobalObject()', () => {
  test('should return the same object', () => {
    const backup = global.process;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    delete global.process;
    const first = getGlobalObject();
    const second = getGlobalObject();
    expect(first).toEqual(second);
    global.process = backup;
  });
});

describe('parseRetryAfterHeader', () => {
  test('no header', () => {
    expect(parseRetryAfterHeader(Date.now())).toEqual(60 * 1000);
  });

  test('incorrect header', () => {
    expect(parseRetryAfterHeader(Date.now(), 'x')).toEqual(60 * 1000);
  });

  test('delay header', () => {
    expect(parseRetryAfterHeader(Date.now(), '1337')).toEqual(1337 * 1000);
  });

  test('date header', () => {
    expect(
      parseRetryAfterHeader(new Date('Wed, 21 Oct 2015 07:28:00 GMT').getTime(), 'Wed, 21 Oct 2015 07:28:13 GMT'),
    ).toEqual(13 * 1000);
  });
});

describe('stripQueryStringAndFragment', () => {
  const urlString = 'http://dogs.are.great:1231/yay/';
  const queryString = '?furry=yes&funny=very';
  const fragment = '#adoptnotbuy';

  it('strips query string from url', () => {
    const urlWithQueryString = `${urlString}${queryString}`;
    expect(stripUrlQueryAndFragment(urlWithQueryString)).toBe(urlString);
  });

  it('strips fragment from url', () => {
    const urlWithFragment = `${urlString}${fragment}`;
    expect(stripUrlQueryAndFragment(urlWithFragment)).toBe(urlString);
  });

  it('strips query string and fragment from url', () => {
    const urlWithQueryStringAndFragment = `${urlString}${queryString}${fragment}`;
    expect(stripUrlQueryAndFragment(urlWithQueryStringAndFragment)).toBe(urlString);
  });
});
