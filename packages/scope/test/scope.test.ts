import { SentryEvent, EventHint, Severity, Span, Transaction } from '@sentry/types';

import { Scope } from '../src';

describe('Scope', () => {
  describe('attributes modification', () => {
    test('setFingerprint', () => {
      const scope = new Scope();
      scope.setFingerprint(['abcd']);
      expect(scope.fingerprint).toEqual(['abcd']);
    });

    test('setExtra', () => {
      const scope = new Scope();
      scope.setExtra('a', 1);
      expect(scope.extra).toEqual({ a: 1 });
    });

    test('setExtras', () => {
      const scope = new Scope();
      scope.setExtras({ a: 1 });
      expect(scope.extra).toEqual({ a: 1 });
    });

    test('setExtras with undefined overrides the value', () => {
      const scope = new Scope();
      scope.setExtra('a', 1);
      scope.setExtras({ a: undefined });
      expect(scope.extra).toEqual({ a: undefined });
    });

    test('setTag', () => {
      const scope = new Scope();
      scope.setTag('a', 'b');
      expect(scope.tags).toEqual({ a: 'b' });
    });

    test('setTags', () => {
      const scope = new Scope();
      scope.setTags({ a: 'b' });
      expect(scope.tags).toEqual({ a: 'b' });
    });

    test('setUser', () => {
      const scope = new Scope();
      scope.setUser({ id: '1' });
      expect(scope.user).toEqual({ id: '1' });
    });

    test('setUser with null unsets the user', () => {
      const scope = new Scope();
      scope.setUser({ id: '1' });
      scope.setUser(null);
      expect(scope.user).toEqual({});
    });

    test('addBreadcrumb', () => {
      const scope = new Scope();
      scope.addBreadcrumb({ message: 'test' });
      expect(scope.breadcrumbs[0]).toHaveProperty('message', 'test');
    });

    test('setLevel', () => {
      const scope = new Scope();
      scope.setLevel(Severity.Warning);
      expect(scope.level).toEqual(Severity.Warning);
    });

    test('setTransactionName', () => {
      const scope = new Scope();
      scope.setTransactionName('/abc');
      expect(scope.transactionName).toEqual('/abc');
    });

    test('setTransactionName with no value unsets it', () => {
      const scope = new Scope();
      scope.setTransactionName('/abc');
      scope.setTransactionName();
      expect(scope.transactionName).toBeUndefined();
    });

    test('setContext', () => {
      const scope = new Scope();
      scope.setContext('os', { id: '1' });
      expect(scope.contexts.os).toEqual({ id: '1' });
    });

    test('setContext with null unsets it', () => {
      const scope = new Scope();
      scope.setContext('os', { id: '1' });
      scope.setContext('os', null);
      expect(scope.user).toEqual({});
    });

    test('setSpan', () => {
      const scope = new Scope();
      const span = ({ fake: 'span' } as unknown) as Span;
      scope.setSpan(span);
      expect(scope.span).toEqual(span);
    });

    test('setSpan with no value unsets it', () => {
      const scope = new Scope();
      scope.setSpan(({ fake: 'span' } as unknown) as Span);
      scope.setSpan();
      expect(scope.span).toEqual(undefined);
    });

    test('chaining', () => {
      const scope = new Scope();
      scope.setLevel(Severity.Warning).setUser({ id: '1' });
      expect(scope.level).toEqual(Severity.Warning);
      expect(scope.user).toEqual({ id: '1' });
    });
  });

  describe('clone', () => {
    test('basic inheritance', () => {
      const parentScope = new Scope();
      parentScope.setExtra('a', 1);
      const scope = parentScope.clone();
      expect(parentScope.extra).toEqual(scope.extra);
    });

    test('parent changed inheritance', () => {
      const parentScope = new Scope();
      const scope = parentScope.clone();
      parentScope.setExtra('a', 2);
      expect(scope.extra).toEqual({});
      expect(parentScope.extra).toEqual({ a: 2 });
    });

    test('child override inheritance', () => {
      const parentScope = new Scope();
      parentScope.setExtra('a', 1);

      const scope = parentScope.clone();
      scope.setExtra('a', 2);
      expect(parentScope.extra).toEqual({ a: 1 });
      expect(scope.extra).toEqual({ a: 2 });
    });
  });

  describe('applyToEvent', () => {
    test('basic usage', () => {
      const scope = new Scope();
      scope.setExtra('a', 2);
      scope.setTag('a', 'b');
      scope.setUser({ id: '1' });
      scope.setFingerprint(['abcd']);
      scope.setLevel(Severity.Warning);
      scope.setTransactionName('/abc');
      scope.addBreadcrumb({ message: 'test' });
      scope.setContext('os', { id: '1' });
      const event: SentryEvent = {};
      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.extra).toEqual({ a: 2 });
      expect(processedEvent!.tags).toEqual({ a: 'b' });
      expect(processedEvent!.user).toEqual({ id: '1' });
      expect(processedEvent!.fingerprint).toEqual(['abcd']);
      expect(processedEvent!.level).toEqual('warning');
      expect(processedEvent!.transaction).toEqual('/abc');
      expect(processedEvent!.breadcrumbs![0]).toHaveProperty('message', 'test');
      expect(processedEvent!.contexts).toEqual({ os: { id: '1' } });
    });

    test('merge with existing event data', () => {
      const scope = new Scope();
      scope.setExtra('a', 2);
      scope.setTag('a', 'b');
      scope.setUser({ id: '1' });
      scope.setFingerprint(['abcd']);
      scope.addBreadcrumb({ message: 'test' });
      scope.setContext('server', { id: '2' });
      const event: SentryEvent = {
        breadcrumbs: [{ message: 'test1' }],
        contexts: { os: { id: '1' } },
        extra: { b: 3 },
        fingerprint: ['efgh'],
        tags: { b: 'c' },
        user: { id: '3' },
      };
      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.extra).toEqual({ a: 2, b: 3 });
      expect(processedEvent!.tags).toEqual({ a: 'b', b: 'c' });
      expect(processedEvent!.user).toEqual({ id: '3' });
      expect(processedEvent!.fingerprint).toEqual(['efgh', 'abcd']);
      expect(processedEvent!.breadcrumbs).toHaveLength(2);
      expect(processedEvent!.breadcrumbs![0]).toHaveProperty('message', 'test1');
      expect(processedEvent!.breadcrumbs![1]).toHaveProperty('message', 'test');
      expect(processedEvent!.contexts).toEqual({
        os: { id: '1' },
        server: { id: '2' },
      });
    });

    test('should make sure that fingerprint is always array', () => {
      const scope = new Scope();
      const event: SentryEvent = {};

      // @ts-ignore we want to be able to assign string value
      event.fingerprint = 'foo';
      let processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.fingerprint).toEqual(['foo']);

      // @ts-ignore we want to be able to assign string value
      event.fingerprint = 'bar';
      processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.fingerprint).toEqual(['bar']);
    });

    test('should merge fingerprint from event and scope', () => {
      const scope = new Scope();
      scope.setFingerprint(['foo']);
      const event: SentryEvent = {
        fingerprint: ['bar'],
      };

      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.fingerprint).toEqual(['bar', 'foo']);
    });

    test('should remove default empty fingerprint array if theres no data available', () => {
      const scope = new Scope();
      const event: SentryEvent = {};
      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.fingerprint).toEqual(undefined);
    });

    test('scope level should have priority over event level', () => {
      const scope = new Scope();
      scope.setLevel(Severity.Warning);
      const event: SentryEvent = {};
      event.level = Severity.Fatal;
      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.level).toEqual('warning');
    });

    test('scope transaction should have priority over event transaction', () => {
      const scope = new Scope();
      scope.setTransactionName('/abc');
      const event: SentryEvent = {
        transaction: '/cdf',
      };
      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.transaction).toEqual('/abc');
    });

    test('applyToEvent trace context', () => {
      const scope = new Scope();
      const span = ({
        fake: 'span',
        getTraceContext: () => ({ a: 'b' }),
      } as unknown) as Span;
      scope.setSpan(span);
      const event: SentryEvent = {};
      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.contexts!.trace.a).toEqual('b');
    });

    test('applyToEvent existing trace context in event should be stronger', () => {
      const scope = new Scope();
      const span = ({
        getTraceContext: () => ({ a: 'b' }),
      } as unknown) as Span;
      scope.setSpan(span);
      const event: SentryEvent = {
        contexts: {
          trace: { a: 'c' },
        },
      };
      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.contexts!.trace.a).toEqual('c');
    });

    test('applyToEvent transaction name tag when transaction on scope', () => {
      const scope = new Scope();
      const transaction = ({
        getTraceContext: () => ({ a: 'b' }),
        name: 'fake transaction',
      } as unknown) as Transaction;
      transaction.transaction = transaction; // because this is a transaction, its transaction pointer points to itself
      scope.setSpan(transaction);
      const event: SentryEvent = {};
      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.tags!.transaction).toEqual('fake transaction');
    });

    test('applyToEvent transaction name tag when span on scope', () => {
      const scope = new Scope();
      const transaction = { name: 'fake transaction' };
      const span = ({
        fake: 'span',
        getTraceContext: () => ({ a: 'b' }),
        transaction,
      } as unknown) as Span;
      scope.setSpan(span);
      const event: SentryEvent = {};
      const processedEvent = scope.applyToEvent(event);
      expect(processedEvent!.tags!.transaction).toEqual('fake transaction');
    });
  });

  test('clear', () => {
    const scope = new Scope();
    scope.setExtra('a', 2);
    scope.setTag('a', 'b');
    scope.setFingerprint(['abcd']);
    scope.addBreadcrumb({ message: 'test' });
    expect(scope.extra).toEqual({ a: 2 });
    scope.clear();
    expect(scope.extra).toEqual({});
  });

  test('clearBreadcrumbs', () => {
    const scope = new Scope();
    scope.addBreadcrumb({ message: 'test' });
    expect(scope.breadcrumbs).toHaveLength(1);
    scope.clearBreadcrumbs();
    expect(scope.breadcrumbs).toHaveLength(0);
  });

  describe('update', () => {
    let scope: Scope;

    beforeEach(() => {
      scope = new Scope();
      scope.setTags({ foo: '1', bar: '2' });
      scope.setExtras({ foo: '1', bar: '2' });
      scope.setContext('foo', { id: '1' });
      scope.setContext('bar', { id: '2' });
      scope.setUser({ id: '1337' });
      scope.setLevel(Severity.Info);
      scope.setFingerprint(['foo']);
    });

    test('given no data, returns the original scope', () => {
      const updatedScope = scope.update({});
      expect(updatedScope).toEqual(scope);
    });

    test('given neither function, Scope or plain object, returns original scope', () => {
      // @ts-ignore we want to be able to test for invalid input
      const updatedScope = scope.update('wat');
      expect(updatedScope).toEqual(scope);
    });

    test('given another instance of Scope, it should merge two together, with the passed scope having priority', () => {
      const localScope = new Scope();
      localScope.setTags({ bar: '3', baz: '4' });
      localScope.setExtras({ bar: '3', baz: '4' });
      localScope.setContext('bar', { id: '3' });
      localScope.setContext('baz', { id: '4' });
      localScope.setUser({ id: '42' });
      localScope.setLevel(Severity.Warning);
      localScope.setFingerprint(['bar']);

      const updatedScope = scope.update(localScope);

      expect(updatedScope.tags).toEqual({
        bar: '3',
        baz: '4',
        foo: '1',
      });
      expect(updatedScope.extra).toEqual({
        bar: '3',
        baz: '4',
        foo: '1',
      });
      expect(updatedScope.contexts).toEqual({
        bar: { id: '3' },
        baz: { id: '4' },
        foo: { id: '1' },
      });
      expect(updatedScope.user).toEqual({ id: '42' });
      expect(updatedScope.level).toEqual(Severity.Warning);
      expect(updatedScope.fingerprint).toEqual(['bar']);
    });

    test('given an empty instance of Scope, it should preserve all the original scope data', () => {
      const updatedScope = scope.update(new Scope());

      expect(updatedScope.tags).toEqual({
        bar: '2',
        foo: '1',
      });
      expect(updatedScope.extra).toEqual({
        bar: '2',
        foo: '1',
      });
      expect(updatedScope.contexts).toEqual({
        bar: { id: '2' },
        foo: { id: '1' },
      });
      expect(updatedScope.user).toEqual({ id: '1337' });
      expect(updatedScope.level).toEqual(Severity.Info);
      expect(updatedScope.fingerprint).toEqual(['foo']);
    });

    test('given a plain object, it should merge two together, with the passed object having priority', () => {
      const localAttributes = {
        contexts: { bar: { id: '3' }, baz: { id: '4' } },
        extra: { bar: '3', baz: '4' },
        fingerprint: ['bar'],
        level: Severity.Warning,
        tags: { bar: '3', baz: '4' },
        user: { id: '42' },
      };
      const updatedScope = scope.update(localAttributes);

      expect(updatedScope.tags).toEqual({
        bar: '3',
        baz: '4',
        foo: '1',
      });
      expect(updatedScope.extra).toEqual({
        bar: '3',
        baz: '4',
        foo: '1',
      });
      expect(updatedScope.contexts).toEqual({
        bar: { id: '3' },
        baz: { id: '4' },
        foo: { id: '1' },
      });
      expect(updatedScope.user).toEqual({ id: '42' });
      expect(updatedScope.level).toEqual(Severity.Warning);
      expect(updatedScope.fingerprint).toEqual(['bar']);
    });
  });

  describe('addEventProcessor', () => {
    test('should allow for basic event manipulation', () => {
      const event: SentryEvent = {
        extra: { b: 3 },
      };
      const localScope = new Scope();
      localScope.setExtra('a', 'b');
      localScope.addEventProcessor((processedEvent: SentryEvent) => {
        expect(processedEvent.extra).toEqual({ a: 'b', b: 3 });
        return processedEvent;
      });
      localScope.addEventProcessor((processedEvent: SentryEvent) => {
        processedEvent.dist = '1';
        return processedEvent;
      });
      localScope.addEventProcessor((processedEvent: SentryEvent) => {
        expect(processedEvent.dist).toEqual('1');
        return processedEvent;
      });

      const processedEvent = localScope.applyToEvent(event);
      expect(processedEvent!.dist).toEqual('1');
    });

    test('should drop an event when any of processors return null', () => {
      const event: SentryEvent = {
        extra: { b: 3 },
      };
      const localScope = new Scope();
      localScope.setExtra('a', 'b');
      localScope.addEventProcessor((_: SentryEvent) => null);
      const processedEvent = localScope.applyToEvent(event);
      expect(processedEvent).toBeNull();
    });

    test('should have an access to the EventHint', () => {
      const event: SentryEvent = {
        extra: { b: 3 },
      };
      const localScope = new Scope();
      localScope.setExtra('a', 'b');
      localScope.addEventProcessor((internalEvent: SentryEvent, hint?: EventHint) => {
        expect(hint).toBeTruthy();
        expect(hint!.syntheticException).toBeTruthy();
        return internalEvent;
      });
      const processedEvent = localScope.applyToEvent(event, { syntheticException: new Error('what') });
      expect(processedEvent).toEqual(event);
    });

    test('should notify all the listeners about the changes', () => {
      jest.useFakeTimers();
      const scope = new Scope();
      const listener = jest.fn();
      scope.addScopeListener(listener);
      scope.setExtra('a', 2);
      jest.runAllTimers();
      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].extra).toEqual({ a: 2 });
    });
  });
});
