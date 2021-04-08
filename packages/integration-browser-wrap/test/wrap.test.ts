import { WrappedFunction } from '@sentry/types';

import { wrap } from '../src/wrap';

describe('internal wrap()', () => {
  it('should wrap functions only', () => {
    const fn = (): number => 1337;
    const obj = { pickle: 'Rick' };
    const arr = ['Morty'];
    const str = 'Rick';
    const num = 42;

    expect(wrap(fn)).not.toEqual(fn);
    // @ts-ignore Issue with `WrappedFunction` type from wrap fn
    expect(wrap(obj)).toEqual(obj);
    // @ts-ignore Issue with `WrappedFunction` type from wrap fn
    expect(wrap(arr)).toEqual(arr);
    // @ts-ignore Issue with `WrappedFunction` type from wrap fn
    expect(wrap(str)).toEqual(str);
    // @ts-ignore Issue with `WrappedFunction` type from wrap fn
    expect(wrap(num)).toEqual(num);
  });

  it('should preserve correct function name when accessed', () => {
    const namedFunction = (): number => 1337;
    expect(wrap(namedFunction)).not.toEqual(namedFunction);
    expect(namedFunction.name).toEqual('namedFunction');
    expect(wrap(namedFunction).name).toEqual('namedFunction');
  });

  it('bail out with the original if accessing custom props go bad', () => {
    const fn = (() => 1337) as WrappedFunction;
    fn.__sentry__ = false;
    Object.defineProperty(fn, '__sentry_wrapped__', {
      get(): void {
        throw new Error('boom');
      },
    });

    expect(wrap(fn)).toEqual(fn);

    Object.defineProperty(fn, '__sentry__', {
      get(): void {
        throw new Error('boom');
      },
      configurable: true,
    });

    expect(wrap(fn)).toEqual(fn);
  });

  it('returns wrapped function if original was already wrapped', () => {
    const fn = (() => 1337) as WrappedFunction;
    const wrapped = wrap(fn);

    expect(wrap(fn)).toEqual(wrapped);
  });

  it('returns same wrapped function if trying to wrap it again', () => {
    const fn = (() => 1337) as WrappedFunction;

    const wrapped = wrap(fn);

    expect(wrap(wrapped)).toEqual(wrapped);
  });

  it('attaches metadata to original and wrapped functions', () => {
    const fn = (() => 1337) as WrappedFunction;

    const wrapped = wrap(fn);

    expect(fn).toHaveProperty('__sentry_wrapped__');
    expect(fn.__sentry_wrapped__).toEqual(wrapped);

    expect(wrapped).toHaveProperty('__sentry__');
    expect(wrapped.__sentry__).toEqual(true);

    expect(wrapped).toHaveProperty('__sentry_original__');
    expect(wrapped.__sentry_original__).toEqual(fn);
  });

  it('copies over original functions properties', () => {
    const fn = (() => 1337) as WrappedFunction;
    fn.some = 1337;
    fn.property = 'Rick';

    const wrapped = wrap(fn);

    expect(wrapped).toHaveProperty('some');
    expect(wrapped.some).toEqual(1337);
    expect(wrapped).toHaveProperty('property');
    expect(wrapped.property).toEqual('Rick');
  });

  it('doesnt break when accessing original functions properties blows up', () => {
    const fn = (() => 1337) as WrappedFunction;
    Object.defineProperty(fn, 'some', {
      get(): void {
        throw new Error('boom');
      },
    });

    const wrapped = wrap(fn);

    expect(wrapped).not.toHaveProperty('some');
  });

  it('recrusively wraps arguments that are functions', () => {
    const fn = (() => 1337) as WrappedFunction;
    const fnArgA = (): number => 1337;
    const fnArgB = (): number => 1337;

    const wrapped = wrap(fn);
    wrapped(fnArgA, fnArgB);

    expect(fnArgA).toHaveProperty('__sentry_wrapped__');
    expect(fnArgB).toHaveProperty('__sentry_wrapped__');
  });

  it('calls either `handleEvent` property if it exists or the original function', () => {
    interface MockWithHandleEvent extends jest.Mock {
      handleEvent: jest.Mock;
    }

    const fn = jest.fn();
    const eventFn = jest.fn() as MockWithHandleEvent;
    eventFn.handleEvent = jest.fn();

    wrap(fn)(123, 'Rick');
    wrap(eventFn)(123, 'Morty');

    expect(fn).toHaveBeenCalledWith(123, 'Rick');
    expect(eventFn.handleEvent).toHaveBeenCalledWith(123, 'Morty');
    expect(eventFn).not.toHaveBeenCalled();
  });

  it('preserves `this` context for all the calls', () => {
    const context = {
      fn(): void {
        expect(this).toEqual(context);
      },
      eventFn(): void {
        return;
      },
    };
    // @ts-ignore eventFn does not have property handleEvent
    context.eventFn.handleEvent = function(): void {
      expect(this).toEqual(context);
    };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const wrappedFn = wrap(context.fn);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const wrappedEventFn = wrap(context.eventFn);

    wrappedFn.call(context);
    wrappedEventFn.call(context);
  });

  it('should rethrow caught exceptions', () => {
    const fn = (): number => {
      throw new Error('boom');
    };
    const wrapped = wrap(fn);

    try {
      wrapped();
    } catch (error) {
      expect(error.message).toEqual('boom');
    }
  });

  it('internal flags shouldnt be enumerable', () => {
    const fn = (() => 1337) as WrappedFunction;
    const wrapped = wrap(fn);

    // Shouldn't show up in iteration
    expect(Object.keys(fn)).not.toContain('__sentry__');
    expect(Object.keys(fn)).not.toContain('__sentry_original__');
    expect(Object.keys(fn)).not.toContain('__sentry_wrapped__');
    expect(Object.keys(wrapped)).not.toContain('__sentry__');
    expect(Object.keys(wrapped)).not.toContain('__sentry_original__');
    expect(Object.keys(wrapped)).not.toContain('__sentry_wrapped__');
    // But should be accessible directly
    expect(wrapped.__sentry__).toEqual(true);
    expect(wrapped.__sentry_original__).toEqual(fn);
    expect(fn.__sentry_wrapped__).toEqual(wrapped);
  });
});
