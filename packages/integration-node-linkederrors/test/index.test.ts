import { ExtendedError, SentryEvent } from '@sentry/types';

import { LinkedErrors } from '../src/index';

describe('LinkedErrors', () => {
  const linkedErrors = new LinkedErrors();

  it('should do nothing if event doesnt contain exception', () => {
    const event = linkedErrors.process({
      message: 'foo',
    });
    expect(event).toEqual({ message: 'foo' });
  });

  it('should do nothing if event contains exception, but no hint', () => {
    const event = linkedErrors.process({ exception: { values: [{}] } });
    expect(event).toEqual({ exception: { values: [{}] } });
  });

  it('should recursively walk error to find linked exceptions and assign them to the event', () => {
    let event: SentryEvent = {
      exception: {
        values: [
          {
            type: 'Error',
            value: 'one',
            stacktrace: {
              frames: [],
            },
          },
        ],
      },
    };
    const one: ExtendedError = new Error('one');
    const two: ExtendedError = new TypeError('two');
    const three: ExtendedError = new SyntaxError('three');
    one.cause = two;
    two.cause = three;

    event = linkedErrors.process(event, {
      originalException: one,
    });

    expect(event.exception!.values!.length).toEqual(3);
    expect(event.exception!.values![0].type).toEqual('SyntaxError');
    expect(event.exception!.values![0].value).toEqual('three');
    expect(event.exception!.values![0].stacktrace).toHaveProperty('frames');
    expect(event.exception!.values![1].type).toEqual('TypeError');
    expect(event.exception!.values![1].value).toEqual('two');
    expect(event.exception!.values![1].stacktrace).toHaveProperty('frames');
    expect(event.exception!.values![2].type).toEqual('Error');
    expect(event.exception!.values![2].value).toEqual('one');
    expect(event.exception!.values![2].stacktrace).toHaveProperty('frames');
  });

  it('should allow to change walk key', () => {
    const linkedErrorsChangedKey = new LinkedErrors({
      key: 'reason',
    });

    let event: SentryEvent = {
      exception: {
        values: [
          {
            type: 'Error',
            value: 'one',
            stacktrace: {
              frames: [],
            },
          },
        ],
      },
    };
    const one: ExtendedError = new Error('one');
    const two: ExtendedError = new TypeError('two');
    const three: ExtendedError = new SyntaxError('three');
    one.reason = two;
    two.reason = three;

    event = linkedErrorsChangedKey.process(event, {
      originalException: one,
    });

    expect(event.exception!.values!.length).toEqual(3);
    expect(event.exception!.values![0].type).toEqual('SyntaxError');
    expect(event.exception!.values![0].value).toEqual('three');
    expect(event.exception!.values![0].stacktrace).toHaveProperty('frames');
    expect(event.exception!.values![1].type).toEqual('TypeError');
    expect(event.exception!.values![1].value).toEqual('two');
    expect(event.exception!.values![1].stacktrace).toHaveProperty('frames');
    expect(event.exception!.values![2].type).toEqual('Error');
    expect(event.exception!.values![2].value).toEqual('one');
    expect(event.exception!.values![2].stacktrace).toHaveProperty('frames');
  });

  it('should allow to change stack size limit', () => {
    const linkedErrorsChangedLimit = new LinkedErrors({
      limit: 2,
    });

    let event: SentryEvent = {
      exception: {
        values: [
          {
            type: 'Error',
            value: 'one',
            stacktrace: {
              frames: [],
            },
          },
        ],
      },
    };
    const one: ExtendedError = new Error('one');
    const two: ExtendedError = new TypeError('two');
    const three: ExtendedError = new SyntaxError('three');
    one.cause = two;
    two.cause = three;

    event = linkedErrorsChangedLimit.process(event, {
      originalException: one,
    });

    expect(event.exception!.values!.length).toEqual(2);
    expect(event.exception!.values![0].type).toEqual('TypeError');
    expect(event.exception!.values![0].value).toEqual('two');
    expect(event.exception!.values![0].stacktrace).toHaveProperty('frames');
    expect(event.exception!.values![1].type).toEqual('Error');
    expect(event.exception!.values![1].value).toEqual('one');
    expect(event.exception!.values![1].stacktrace).toHaveProperty('frames');
  });
});
